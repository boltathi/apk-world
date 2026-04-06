"""Image upload endpoint — stores images in Redis as base64."""
import base64
import uuid
from flask import request, current_app
from flask_restx import Namespace, Resource
from ...utils.decorators import admin_required
from ...extensions import limiter, redis_data

ns = Namespace("upload", description="File upload operations")

MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_MIMETYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
}


@ns.route("/image")
class ImageUpload(Resource):
    @admin_required()
    @limiter.limit("30/minute")
    def post(self):
        """Upload an image (max 2 MB). Stored in Redis, returns a serve URL."""
        if "image" not in request.files:
            return {"error": "No image file provided"}, 400

        file = request.files["image"]
        if not file.filename:
            return {"error": "No file selected"}, 400

        # Validate MIME type
        if file.content_type not in ALLOWED_MIMETYPES:
            return {
                "error": f"Unsupported image type: {file.content_type}. "
                         f"Allowed: JPEG, PNG, GIF, WebP, SVG"
            }, 400

        # Read file data and check size
        data = file.read()
        if len(data) > MAX_IMAGE_SIZE:
            size_mb = len(data) / (1024 * 1024)
            return {
                "error": f"Image too large ({size_mb:.1f} MB). Maximum is 2 MB."
            }, 400

        if len(data) == 0:
            return {"error": "Empty file"}, 400

        # Generate unique ID and store in Redis
        image_id = str(uuid.uuid4())
        b64_data = base64.b64encode(data).decode("utf-8")
        content_type = file.content_type

        # Store as a hash with base64 data, content type, and original filename
        redis_key = f"images:{image_id}"
        try:
            redis_data.hset(redis_key, mapping={
                "data": b64_data,
                "content_type": content_type,
                "filename": file.filename[:200],
                "size": str(len(data)),
            })
        except Exception as e:
            current_app.logger.error(f"Redis image store failed: {e}")
            return {"error": "Failed to store image"}, 500

        # Build the serve URL
        domain = current_app.config.get("DOMAIN", "localhost:5000")
        scheme = "https" if domain != "localhost:5000" else "http"
        url = f"{scheme}://{domain}/api/v1/upload/image/{image_id}"

        return {
            "url": url,
            "id": image_id,
            "size": len(data),
            "content_type": content_type,
            "message": "Image uploaded successfully",
        }, 201


@ns.route("/image/<string:image_id>")
class ImageServe(Resource):
    @limiter.limit("120/minute")
    def get(self, image_id):
        """Serve a stored image by ID."""
        # Validate UUID format
        try:
            uuid.UUID(image_id, version=4)
        except ValueError:
            return {"error": "Invalid image ID"}, 400

        redis_key = f"images:{image_id}"
        try:
            img_data = redis_data.hgetall(redis_key)
        except Exception:
            return {"error": "Image not found"}, 404

        if not img_data or "data" not in img_data:
            return {"error": "Image not found"}, 404

        # Decode base64 and return as binary response
        raw = base64.b64decode(img_data["data"])
        content_type = img_data.get("content_type", "image/png")

        from flask import make_response
        response = make_response(raw)
        response.headers["Content-Type"] = content_type
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        response.headers["Content-Length"] = str(len(raw))
        return response
