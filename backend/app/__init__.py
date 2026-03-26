"""APK World — Minimal Flask App."""
from flask import Flask, jsonify


def create_app():
    app = Flask(__name__)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "healthy", "app": "apk-world"})

    @app.route("/api/hello")
    def hello():
        return jsonify({"message": "Hello from APK World! 🌍"})

    return app
