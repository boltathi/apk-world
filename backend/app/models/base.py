"""Redis-backed repository — base class for all data models.

Each collection is stored as:
  - String per record:  <collection>:<id>  → JSON blob
  - Sorted set index:   <collection>:_idx  → score=timestamp, member=id
  - Secondary indexes:  <collection>:_f:<field>:<value> → set of ids

Design: drop-in replacement for the old JsonRepository; same public API.
"""
import json
import re
import uuid
from datetime import datetime, timezone

import redis as redis_lib

# Maximum records a single collection may hold (DoS guard)
_MAX_RECORDS = 10_000
# Maximum pagination page-size
MAX_PER_PAGE = 100
# Whitelist for collection names
_COLLECTION_RE = re.compile(r"^[a-z][a-z0-9_]{0,30}$")

# Fields that get secondary indexes for fast filtering
_INDEXED_FIELDS = (
    "status", "category", "is_featured", "difficulty", "slug",
    "resource_type", "role", "username",
)


class RedisRepository:
    """Generic Redis-backed repository.

    All records are JSON-serialized into Redis strings so that individual
    reads are O(1) instead of deserializing the whole file.  Secondary set
    indexes support fast filtered queries.
    """

    def __init__(self, redis_client: redis_lib.Redis, collection: str):
        if not _COLLECTION_RE.match(collection):
            raise ValueError(f"Invalid collection name: {collection!r}")
        self._r: redis_lib.Redis = redis_client
        self._col = collection
        self._idx_key = f"{collection}:_idx"          # sorted set (score=ts)

    # ── Key helpers ───────────────────────────────

    def _record_key(self, record_id: str) -> str:
        return f"{self._col}:{record_id}"

    def _filter_key(self, field: str, value: str) -> str:
        """Secondary-index set key for exact-match filters."""
        return f"{self._col}:_f:{field}:{value}"

    # ── Low-level I/O ─────────────────────────────

    def _get(self, record_id: str) -> dict | None:
        raw = self._r.get(self._record_key(record_id))
        if raw is None:
            return None
        return json.loads(raw)

    def _put(self, record: dict) -> None:
        """Write a record and maintain all indexes atomically."""
        rid = record["id"]
        try:
            ts = datetime.fromisoformat(record.get("created_at", "")).timestamp()
        except (ValueError, TypeError):
            ts = datetime.now(timezone.utc).timestamp()

        pipe = self._r.pipeline()
        pipe.set(self._record_key(rid), json.dumps(record, default=str))
        pipe.zadd(self._idx_key, {rid: ts})
        for field in _INDEXED_FIELDS:
            val = record.get(field)
            if val is not None:
                pipe.sadd(self._filter_key(field, str(val)), rid)
        pipe.execute()

    def _remove(self, record: dict) -> None:
        """Delete a record and clean up all indexes atomically."""
        rid = record["id"]
        pipe = self._r.pipeline()
        pipe.delete(self._record_key(rid))
        pipe.zrem(self._idx_key, rid)
        for field in _INDEXED_FIELDS:
            val = record.get(field)
            if val is not None:
                pipe.srem(self._filter_key(field, str(val)), rid)
        pipe.execute()

    def _all_ids(self, sort_desc: bool = True) -> list[str]:
        """Return all record IDs ordered by creation time."""
        if sort_desc:
            return self._r.zrevrange(self._idx_key, 0, -1)
        return self._r.zrange(self._idx_key, 0, -1)

    # ── CRUD ──────────────────────────────────────

    @staticmethod
    def _validate_id(record_id: str) -> str:
        """Validate that an ID is a proper UUID to prevent injection."""
        try:
            return str(uuid.UUID(record_id, version=4))
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid record ID: {record_id!r}")

    def find_all(
        self,
        filters: dict | None = None,
        sort_by: str = "created_at",
        sort_desc: bool = True,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        """Return paginated, filtered, sorted list + total count."""
        page = max(1, page)
        per_page = max(1, min(per_page, MAX_PER_PAGE))

        # Narrow candidate IDs via secondary indexes when possible
        candidate_ids = None
        if filters:
            for key, value in filters.items():
                if value is None:
                    continue
                members = self._r.smembers(self._filter_key(key, str(value)))
                candidate_ids = members if candidate_ids is None else (candidate_ids & members)

        if candidate_ids is not None:
            records = []
            for rid in candidate_ids:
                rec = self._get(rid)
                if rec and all(rec.get(k) == v for k, v in filters.items() if v is not None):
                    records.append(rec)
        else:
            all_ids = self._all_ids(sort_desc=False)
            records = [r for rid in all_ids if (r := self._get(rid))]

        total = len(records)

        # Sort — only allow known safe sort keys
        safe_sort = sort_by if sort_by in (
            "created_at", "updated_at", "published_at", "title", "order",
        ) else "created_at"
        records.sort(key=lambda r: r.get(safe_sort, ""), reverse=sort_desc)

        # Paginate
        start = (page - 1) * per_page
        return records[start : start + per_page], total

    def find_by_id(self, record_id: str) -> dict | None:
        record_id = self._validate_id(record_id)
        return self._get(record_id)

    def find_one(self, **kwargs) -> dict | None:
        """Find a single record matching all key=value pairs.

        Uses secondary indexes for O(1)-ish lookup when possible.
        """
        indexed = {k: v for k, v in kwargs.items() if k in _INDEXED_FIELDS}

        if indexed:
            first_key = next(iter(indexed))
            candidate_ids = self._r.smembers(
                self._filter_key(first_key, str(indexed[first_key]))
            )
            for k, v in indexed.items():
                if k == first_key:
                    continue
                candidate_ids = candidate_ids & self._r.smembers(
                    self._filter_key(k, str(v))
                )
            for rid in candidate_ids:
                rec = self._get(rid)
                if rec and all(rec.get(k) == v for k, v in kwargs.items()):
                    return rec
            return None

        # Fallback: scan all records
        for rid in self._all_ids():
            rec = self._get(rid)
            if rec and all(rec.get(k) == v for k, v in kwargs.items()):
                return rec
        return None

    def create(self, data: dict) -> dict:
        if self._r.zcard(self._idx_key) >= _MAX_RECORDS:
            raise RuntimeError("Storage limit reached")
        now = datetime.now(timezone.utc).isoformat()
        data["id"] = str(uuid.uuid4())
        data["created_at"] = now
        data["updated_at"] = now
        self._put(data)
        return data

    def update(self, record_id: str, data: dict) -> dict | None:
        record_id = self._validate_id(record_id)
        existing = self._get(record_id)
        if not existing:
            return None
        # Remove old secondary indexes before merging
        self._remove(existing)
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        merged = {**existing, **data}
        self._put(merged)
        return merged

    def delete(self, record_id: str) -> bool:
        record_id = self._validate_id(record_id)
        existing = self._get(record_id)
        if not existing:
            return False
        self._remove(existing)
        return True

    def count(self, filters: dict | None = None) -> int:
        if not filters:
            return self._r.zcard(self._idx_key)
        candidate_ids = None
        for key, value in filters.items():
            if value is None:
                continue
            members = self._r.smembers(self._filter_key(key, str(value)))
            candidate_ids = members if candidate_ids is None else (candidate_ids & members)
        return len(candidate_ids) if candidate_ids is not None else 0

    def search(
        self,
        query: str,
        fields: list[str],
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[dict], int]:
        """Full-text search across specified fields."""
        q = query.lower()
        matched = []
        for rid in self._all_ids():
            rec = self._get(rid)
            if rec and any(q in str(rec.get(f, "")).lower() for f in fields):
                matched.append(rec)
        total = len(matched)
        start = (page - 1) * per_page
        return matched[start : start + per_page], total
