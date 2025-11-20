import firebase_admin
from firebase_admin import credentials, messaging
from flask import current_app
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import json
import os

class NotificationService:
    """Handle push notifications, email, and SMS"""
    
    def __init__(self):
        self.firebase_app = None
        self.twilio_client = None
        self._init_firebase()
        self._init_twilio()
    
    def _init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                # Initialize Firebase with service account key
                firebase_key = current_app.config.get('FIREBASE_SERVER_KEY')
                if firebase_key:
                    # If using service account JSON string
                    if isinstance(firebase_key, str) and firebase_key.startswith('{'):
                        cred_dict = json.loads(firebase_key)
                        cred = credentials.Certificate(cred_dict)
                    else:
                        # If using file path
                        cred = credentials.Certificate(firebase_key)
                    
                    self.firebase_app = firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"Firebase initialization error: {e}")
    
    def _init_twilio(self):
        """Initialize Twilio client"""
        try:
            account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
            auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
            
            if account_sid and auth_token:
                self.twilio_client = Client(account_sid, auth_token)
        except Exception as e:
            print(f"Twilio initialization error: {e}")
    
    def send_push_notification(self, fcm_token, title, body, data=None):
        """Send push notification via Firebase"""
        if not self.firebase_app or not fcm_token:
            return False
        
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=fcm_token
            )
            
            response = messaging.send(message)
            print(f"Push notification sent: {response}")
            return True
        except Exception as e:
            print(f"Push notification error: {e}")
            return False
    
    def send_email(self, to_email, subject, body, is_html=False):
        """Send email notification"""
        try:
            smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = current_app.config.get('SMTP_PORT', 587)
            smtp_username = current_app.config.get('SMTP_USERNAME')
            smtp_password = current_app.config.get('SMTP_PASSWORD')
            
            if not all([smtp_username, smtp_password]):
                print("Email configuration missing")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = smtp_username
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html' if is_html else 'plain'))
            
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            server.quit()
            
            print(f"Email sent to {to_email}")
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False
    
    def send_sms(self, phone_number, message):
        """Send SMS notification via Twilio"""
        if not self.twilio_client:
            print("Twilio not configured")
            return False
        
        try:
            from_number = current_app.config.get('TWILIO_PHONE_NUMBER')
            if not from_number:
                print("Twilio phone number not configured")
                return False
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=from_number,
                to=phone_number
            )
            
            print(f"SMS sent to {phone_number}: {message.sid}")
            return True
        except Exception as e:
            print(f"SMS error: {e}")
            return False
    
    def notify_status_change(self, user, report, old_status, new_status, comment=None):
        """Send notification when report status changes"""
        title = f"Report Update - {report.title}"
        
        status_messages = {
            'acknowledged': 'Your report has been acknowledged by authorities.',
            'in_progress': 'Work has started on your reported issue.',
            'resolved': 'Your reported issue has been resolved!'
        }
        
        body = status_messages.get(new_status, f'Your report status has been updated to {new_status}.')
        
        if comment:
            body += f"\n\nComment: {comment}"
        
        # Send push notification
        if user.fcm_token:
            self.send_push_notification(
                user.fcm_token,
                title,
                body,
                {
                    'report_id': str(report.id),
                    'status': new_status,
                    'type': 'status_update'
                }
            )
        
        # Send email if available
        if user.email:
            email_body = f"""
            <h2>{title}</h2>
            <p>Dear {user.name},</p>
            <p>{body}</p>
            <p><strong>Report Details:</strong></p>
            <ul>
                <li>Report ID: {report.id}</li>
                <li>Category: {report.category.value.title()}</li>
                <li>Status: {new_status.title()}</li>
                <li>Location: {report.address or 'Not specified'}</li>
            </ul>
            <p>Thank you for helping improve our community!</p>
            <p>Best regards,<br>CivEase Team</p>
            """
            self.send_email(user.email, title, email_body, is_html=True)
        
        # Send SMS for critical updates
        if new_status in ['resolved'] and user.phone_number:
            sms_message = f"CivEase: Your report '{report.title}' has been {new_status}. Thank you for your contribution!"
            self.send_sms(user.phone_number, sms_message)
    
    def notify_assignment(self, officer, report):
        """Notify officer when a report is assigned to them"""
        title = f"New Assignment - {report.title}"
        body = f"A new report has been assigned to you in the {report.category.value} category."
        
        # Send push notification
        if officer.fcm_token:
            self.send_push_notification(
                officer.fcm_token,
                title,
                body,
                {
                    'report_id': str(report.id),
                    'type': 'assignment'
                }
            )
        
        # Send email
        if officer.email:
            email_body = f"""
            <h2>{title}</h2>
            <p>Dear {officer.name},</p>
            <p>A new report has been assigned to you:</p>
            <ul>
                <li>Report ID: {report.id}</li>
                <li>Title: {report.title}</li>
                <li>Category: {report.category.value.title()}</li>
                <li>Location: {report.address or 'Not specified'}</li>
                <li>Reported by: {report.reporter.name}</li>
            </ul>
            <p>Please review and take appropriate action.</p>
            <p>Best regards,<br>CivEase Admin</p>
            """
            self.send_email(officer.email, title, email_body, is_html=True)

# Global notification service instance
notification_service = NotificationService()
