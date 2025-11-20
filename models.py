from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from enum import Enum

class UserRole(Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"

class ProblemStatus(Enum):
    REPORTED = "reported"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class ProblemCategory(Enum):
    ROAD = "road"
    GARBAGE = "garbage"
    WATER = "water"
    ELECTRICITY = "electricity"
    HOUSING = "housing"
    OTHER = "other"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role = db.Column(db.Enum(UserRole), default=UserRole.CITIZEN, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    fcm_token = db.Column(db.String(255), nullable=True)  # For push notifications
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    reports = db.relationship('ProblemReport', backref='reporter', lazy=True)
    assigned_reports = db.relationship('ProblemReport', backref='assigned_officer', 
                                     foreign_keys='ProblemReport.assigned_to', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'phone_number': self.phone_number,
            'email': self.email,
            'name': self.name,
            'role': self.role.value,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }

class ProblemReport(db.Model):
    __tablename__ = 'problem_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.Enum(ProblemCategory), nullable=False)
    status = db.Column(db.Enum(ProblemStatus), default=ProblemStatus.REPORTED)
    
    # Location data
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(500), nullable=True)
    
    # File attachments
    photo_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)
    
    # Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    notifications = db.relationship('Notification', backref='report', lazy=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    status_updates = db.relationship('StatusUpdate', backref='report', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category.value,
            'status': self.status.value,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'photo_url': self.photo_url,
            'video_url': self.video_url,
            'user_id': self.user_id,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'reporter': self.reporter.to_dict() if self.reporter else None,
            'assigned_officer': self.assigned_officer.to_dict() if self.assigned_officer else None
        }

class StatusUpdate(db.Model):
    __tablename__ = 'status_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('problem_reports.id'), nullable=False)
    old_status = db.Column(db.Enum(ProblemStatus), nullable=True)
    new_status = db.Column(db.Enum(ProblemStatus), nullable=False)
    comment = db.Column(db.Text, nullable=True)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    updater = db.relationship('User', foreign_keys=[updated_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'old_status': self.old_status.value if self.old_status else None,
            'new_status': self.new_status.value,
            'comment': self.comment,
            'updated_by': self.updated_by,
            'created_at': self.created_at.isoformat(),
            'updater': self.updater.to_dict() if self.updater else None
        }

class OTPVerification(db.Model):
    __tablename__ = 'otp_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(15), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_id = db.Column(db.Integer, db.ForeignKey('problem_reports.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # status_update, assignment, reminder
    is_read = db.Column(db.Boolean, default=False)
    sent_via_push = db.Column(db.Boolean, default=False)
    sent_via_email = db.Column(db.Boolean, default=False)
    sent_via_sms = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='notifications')
    report = db.relationship('ProblemReport', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'report_id': self.report_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'sent_via_push': self.sent_via_push,
            'sent_via_email': self.sent_via_email,
            'sent_via_sms': self.sent_via_sms,
            'created_at': self.created_at.isoformat()
        }
