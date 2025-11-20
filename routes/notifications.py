from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Notification, ProblemReport
from app import db
from services.notification_service import notification_service

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user's notifications"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    # Build query
    query = Notification.query.filter_by(user_id=user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    # Order by creation date (newest first)
    query = query.order_by(Notification.created_at.desc())
    
    # Paginate results
    notifications = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return jsonify({
        'notifications': [notification.to_dict() for notification in notifications.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': notifications.total,
            'pages': notifications.pages,
            'has_next': notifications.has_next,
            'has_prev': notifications.has_prev
        },
        'unread_count': Notification.query.filter_by(user_id=user_id, is_read=False).count()
    }), 200

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}), 200

@notifications_bp.route('/notifications/read-all', methods=['PATCH'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read"""
    user_id = get_jwt_identity()
    
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/fcm-token', methods=['POST'])
@jwt_required()
def update_fcm_token():
    """Update user's FCM token for push notifications"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    fcm_token = data.get('fcm_token')
    
    if not fcm_token:
        return jsonify({'error': 'FCM token is required'}), 400
    
    user.fcm_token = fcm_token
    db.session.commit()
    
    return jsonify({'message': 'FCM token updated successfully'}), 200

@notifications_bp.route('/test-notification', methods=['POST'])
@jwt_required()
def send_test_notification():
    """Send test notification (for development/testing)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Send test push notification
    success = notification_service.send_push_notification(
        user.fcm_token,
        "Test Notification",
        "This is a test notification from CivEase!",
        {'type': 'test'}
    )
    
    # Create notification record
    notification = Notification(
        user_id=user_id,
        title="Test Notification",
        message="This is a test notification from CivEase!",
        notification_type="test",
        sent_via_push=success
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({
        'message': 'Test notification sent',
        'success': success
    }), 200
