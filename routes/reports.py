from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import ProblemReport, User, ProblemCategory, ProblemStatus, StatusUpdate, Notification
from app import db
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from services.notification_service import notification_service

reports_bp = Blueprint('reports', __name__)

# File upload configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def upload_to_s3(file, bucket_name, object_name=None):
    """Upload a file to an S3 bucket"""
    if object_name is None:
        object_name = file.filename

    s3_client = boto3.client(
        's3',
        aws_access_key_id=current_app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=current_app.config['AWS_SECRET_ACCESS_KEY']
    )
    
    try:
        s3_client.upload_fileobj(file, bucket_name, object_name)
        return f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
    except ClientError as e:
        return None

def save_file_locally(file):
    """Save file locally if S3 is not configured"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        return f"/uploads/{unique_filename}"
    return None

@reports_bp.route('/report', methods=['POST'])
@jwt_required()
def create_report():
    """Create a new problem report"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_verified:
        return jsonify({'error': 'User not verified'}), 403
    
    # Get form data
    title = request.form.get('title')
    description = request.form.get('description')
    category = request.form.get('category')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    address = request.form.get('address')
    
    # Validate required fields
    if not all([title, description, category, latitude, longitude]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate category
    try:
        category_enum = ProblemCategory(category)
    except ValueError:
        return jsonify({'error': 'Invalid category'}), 400
    
    # Handle file uploads
    photo_url = None
    video_url = None
    
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo and allowed_file(photo.filename):
            # Try S3 upload first, fallback to local
            if current_app.config.get('AWS_S3_BUCKET'):
                photo_url = upload_to_s3(photo, current_app.config['AWS_S3_BUCKET'], 
                                       f"photos/{uuid.uuid4()}_{secure_filename(photo.filename)}")
            if not photo_url:
                photo_url = save_file_locally(photo)
    
    if 'video' in request.files:
        video = request.files['video']
        if video and allowed_file(video.filename):
            # Try S3 upload first, fallback to local
            if current_app.config.get('AWS_S3_BUCKET'):
                video_url = upload_to_s3(video, current_app.config['AWS_S3_BUCKET'], 
                                       f"videos/{uuid.uuid4()}_{secure_filename(video.filename)}")
            if not video_url:
                video_url = save_file_locally(video)
    
    # Create problem report
    report = ProblemReport(
        title=title,
        description=description,
        category=category_enum,
        latitude=float(latitude),
        longitude=float(longitude),
        address=address,
        photo_url=photo_url,
        video_url=video_url,
        user_id=user_id
    )
    
    db.session.add(report)
    db.session.commit()
    
    # Create initial status update
    status_update = StatusUpdate(
        report_id=report.id,
        new_status=ProblemStatus.REPORTED,
        comment="Problem reported by citizen",
        updated_by=user_id
    )
    db.session.add(status_update)
    db.session.commit()
    
    return jsonify({
        'message': 'Report created successfully',
        'report': report.to_dict()
    }), 201

@reports_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """Get all reports with filtering options"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters for filtering
    category = request.args.get('category')
    status = request.args.get('status')
    user_reports_only = request.args.get('user_reports_only', 'false').lower() == 'true'
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    # Build query
    query = ProblemReport.query
    
    # Filter by user's reports only
    if user_reports_only:
        query = query.filter_by(user_id=user_id)
    
    # Filter by category
    if category:
        try:
            category_enum = ProblemCategory(category)
            query = query.filter_by(category=category_enum)
        except ValueError:
            return jsonify({'error': 'Invalid category'}), 400
    
    # Filter by status
    if status:
        try:
            status_enum = ProblemStatus(status)
            query = query.filter_by(status=status_enum)
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
    
    # Order by creation date (newest first)
    query = query.order_by(ProblemReport.created_at.desc())
    
    # Paginate results
    reports = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    return jsonify({
        'reports': [report.to_dict() for report in reports.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': reports.total,
            'pages': reports.pages,
            'has_next': reports.has_next,
            'has_prev': reports.has_prev
        }
    }), 200

@reports_bp.route('/report/<int:report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get a specific report with status history"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    report = ProblemReport.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    
    # Get status history
    status_updates = StatusUpdate.query.filter_by(report_id=report_id).order_by(StatusUpdate.created_at.asc()).all()
    
    report_data = report.to_dict()
    report_data['status_history'] = [update.to_dict() for update in status_updates]
    
    return jsonify({'report': report_data}), 200

@reports_bp.route('/report/<int:report_id>/status', methods=['PATCH'])
@jwt_required()
def update_report_status(report_id):
    """Update report status (Officers/Admins only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    report = ProblemReport.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    comment = data.get('comment', '')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        new_status_enum = ProblemStatus(new_status)
    except ValueError:
        return jsonify({'error': 'Invalid status'}), 400
    
    # Store old status
    old_status = report.status
    
    # Update report status
    report.status = new_status_enum
    report.updated_at = datetime.utcnow()
    
    # Set resolved timestamp if status is resolved
    if new_status_enum == ProblemStatus.RESOLVED:
        report.resolved_at = datetime.utcnow()
    
    # Create status update record
    status_update = StatusUpdate(
        report_id=report_id,
        old_status=old_status,
        new_status=new_status_enum,
        comment=comment,
        updated_by=user_id
    )
    
    db.session.add(status_update)
    
    notification = Notification(
        user_id=report.user_id,
        report_id=report_id,
        title=f"Report Update - {report.title}",
        message=f"Your report status has been updated to {new_status_enum.value.replace('_', ' ').title()}",
        notification_type="status_update"
    )
    db.session.add(notification)
    db.session.commit()
    
    # Send notifications
    notification_service.notify_status_change(
        report.reporter, 
        report, 
        old_status.value if old_status else None, 
        new_status_enum.value, 
        comment
    )
    
    return jsonify({
        'message': 'Status updated successfully',
        'report': report.to_dict()
    }), 200

@reports_bp.route('/report/<int:report_id>/assign', methods=['PATCH'])
@jwt_required()
def assign_report(report_id):
    """Assign report to an officer (Admins only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    report = ProblemReport.query.get(report_id)
    if not report:
        return jsonify({'error': 'Report not found'}), 404
    
    data = request.get_json()
    officer_id = data.get('officer_id')
    
    if not officer_id:
        return jsonify({'error': 'Officer ID is required'}), 400
    
    # Verify officer exists and has correct role
    officer = User.query.get(officer_id)
    if not officer or officer.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Invalid officer'}), 400
    
    # Assign report
    report.assigned_to = officer_id
    report.updated_at = datetime.utcnow()
    
    # Create status update if not already acknowledged
    if report.status == ProblemStatus.REPORTED:
        report.status = ProblemStatus.ACKNOWLEDGED
        
        status_update = StatusUpdate(
            report_id=report_id,
            old_status=ProblemStatus.REPORTED,
            new_status=ProblemStatus.ACKNOWLEDGED,
            comment=f"Assigned to {officer.name}",
            updated_by=user_id
        )
        db.session.add(status_update)
    
    notification = Notification(
        user_id=officer_id,
        report_id=report_id,
        title=f"New Assignment - {report.title}",
        message=f"A new report has been assigned to you in the {report.category.value} category",
        notification_type="assignment"
    )
    db.session.add(notification)
    db.session.commit()
    
    # Send assignment notification
    notification_service.notify_assignment(officer, report)
    
    return jsonify({
        'message': 'Report assigned successfully',
        'report': report.to_dict()
    }), 200

@reports_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all available problem categories"""
    categories = [{'value': cat.value, 'label': cat.value.replace('_', ' ').title()} 
                 for cat in ProblemCategory]
    return jsonify({'categories': categories}), 200

@reports_bp.route('/statuses', methods=['GET'])
def get_statuses():
    """Get all available problem statuses"""
    statuses = [{'value': status.value, 'label': status.value.replace('_', ' ').title()} 
               for status in ProblemStatus]
    return jsonify({'statuses': statuses}), 200
