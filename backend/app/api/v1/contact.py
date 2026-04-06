"""Contact form endpoint — sends email via SMTP."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import current_app, request
from flask_restx import Namespace, Resource, fields

ns = Namespace("contact", description="Contact form")

contact_model = ns.model("ContactForm", {
    "name": fields.String(required=True, description="Sender name", min_length=1, max_length=100),
    "email": fields.String(required=True, description="Sender email", max_length=200),
    "message": fields.String(required=True, description="Message body", min_length=1, max_length=5000),
})


@ns.route("")
class ContactSubmit(Resource):
    @ns.expect(contact_model)
    def post(self):
        """Submit contact form — sends email to site owner."""
        import bleach

        data = request.get_json()
        if not data:
            return {"message": "No data provided"}, 400

        name = bleach.clean(data.get("name", "").strip())
        email = bleach.clean(data.get("email", "").strip())
        message = bleach.clean(data.get("message", "").strip())

        if not name or not email or not message:
            return {"message": "All fields are required"}, 400

        if len(message) > 5000:
            return {"message": "Message too long (max 5000 characters)"}, 400

        # SMTP config from env
        smtp_user = current_app.config.get("SMTP_USER")
        smtp_pass = current_app.config.get("SMTP_PASSWORD")
        contact_to = current_app.config.get("CONTACT_EMAIL")

        if not smtp_user or not smtp_pass or not contact_to:
            current_app.logger.error("SMTP not configured — SMTP_USER, SMTP_PASSWORD, or CONTACT_EMAIL missing")
            return {"message": "Contact form is not configured. Please email directly."}, 503

        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = contact_to
            msg["Subject"] = f"[APK World] New message from {name}"
            msg["Reply-To"] = email

            body = (
                f"Name: {name}\n"
                f"Email: {email}\n"
                f"{'─' * 40}\n\n"
                f"{message}\n"
            )
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)

            current_app.logger.info(f"Contact email sent from {email}")
            return {"message": "Message sent successfully"}, 200

        except smtplib.SMTPAuthenticationError:
            current_app.logger.error("SMTP authentication failed — check SMTP_USER and SMTP_PASSWORD (App Password)")
            return {"message": "Email service error. Please try again later."}, 503
        except Exception as e:
            current_app.logger.error(f"Failed to send contact email: {e}")
            return {"message": "Failed to send message. Please try again later."}, 500
