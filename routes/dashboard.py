from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, ProblemReport, ProblemCategory, ProblemStatus, StatusUpdate
from app import db
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
import calendar

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Get date range from query parameters
    days = int(request.args.get('days', 30))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Basic statistics
    total_reports = ProblemReport.query.count()
    recent_reports = ProblemReport.query.filter(ProblemReport.created_at >= start_date).count()
    
    # Status distribution
    status_stats = db.session.query(
        ProblemReport.status,
        func.count(ProblemReport.id).label('count')
    ).group_by(ProblemReport.status).all()
    
    status_distribution = {status.value: 0 for status in ProblemStatus}
    for status, count in status_stats:
        status_distribution[status.value] = count
    
    # Category distribution
    category_stats = db.session.query(
        ProblemReport.category,
        func.count(ProblemReport.id).label('count')
    ).group_by(ProblemReport.category).all()
    
    category_distribution = {category.value: 0 for category in ProblemCategory}
    for category, count in category_stats:
        category_distribution[category.value] = count
    
    # Resolution rate
    resolved_count = ProblemReport.query.filter_by(status=ProblemStatus.RESOLVED).count()
    resolution_rate = (resolved_count / total_reports * 100) if total_reports > 0 else 0
    
    # Average resolution time
    resolved_reports = ProblemReport.query.filter(
        and_(
            ProblemReport.status == ProblemStatus.RESOLVED,
            ProblemReport.resolved_at.isnot(None)
        )
    ).all()
    
    avg_resolution_time = 0
    if resolved_reports:
        total_time = sum([
            (report.resolved_at - report.created_at).total_seconds() / 3600  # in hours
            for report in resolved_reports
        ])
        avg_resolution_time = total_time / len(resolved_reports)
    
    # Recent activity (last 7 days)
    recent_activity = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        daily_reports = ProblemReport.query.filter(
            and_(
                ProblemReport.created_at >= day_start,
                ProblemReport.created_at < day_end
            )
        ).count()
        
        recent_activity.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'reports': daily_reports
        })
    
    # Top categories this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    top_categories = db.session.query(
        ProblemReport.category,
        func.count(ProblemReport.id).label('count')
    ).filter(ProblemReport.created_at >= month_start)\
     .group_by(ProblemReport.category)\
     .order_by(func.count(ProblemReport.id).desc())\
     .limit(5).all()
    
    return jsonify({
        'overview': {
            'total_reports': total_reports,
            'recent_reports': recent_reports,
            'resolution_rate': round(resolution_rate, 2),
            'avg_resolution_time_hours': round(avg_resolution_time, 2)
        },
        'status_distribution': status_distribution,
        'category_distribution': category_distribution,
        'recent_activity': list(reversed(recent_activity)),
        'top_categories': [
            {'category': cat.value, 'count': count} 
            for cat, count in top_categories
        ]
    }), 200

@dashboard_bp.route('/reports/assigned', methods=['GET'])
@jwt_required()
def get_assigned_reports():
    """Get reports assigned to current officer"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Get query parameters
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    # Build query for assigned reports
    query = ProblemReport.query.filter_by(assigned_to=user_id)
    
    # Filter by status if provided
    if status:
        try:
            status_enum = ProblemStatus(status)
            query = query.filter_by(status=status_enum)
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
    
    # Order by priority (reported first, then by creation date)
    query = query.order_by(
        ProblemReport.status.asc(),
        ProblemReport.created_at.desc()
    )
    
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

@dashboard_bp.route('/officers', methods=['GET'])
@jwt_required()
def get_officers():
    """Get all officers for assignment (Admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    officers = User.query.filter(
        or_(User.role == 'officer', User.role == 'admin')
    ).all()
    
    # Get workload for each officer
    officers_data = []
    for officer in officers:
        active_reports = ProblemReport.query.filter(
            and_(
                ProblemReport.assigned_to == officer.id,
                ProblemReport.status.in_([ProblemStatus.ACKNOWLEDGED, ProblemStatus.IN_PROGRESS])
            )
        ).count()
        
        total_assigned = ProblemReport.query.filter_by(assigned_to=officer.id).count()
        resolved_reports = ProblemReport.query.filter(
            and_(
                ProblemReport.assigned_to == officer.id,
                ProblemReport.status == ProblemStatus.RESOLVED
            )
        ).count()
        
        officers_data.append({
            'id': officer.id,
            'name': officer.name,
            'email': officer.email,
            'role': officer.role.value,
            'active_reports': active_reports,
            'total_assigned': total_assigned,
            'resolved_reports': resolved_reports
        })
    
    return jsonify({'officers': officers_data}), 200

@dashboard_bp.route('/analytics/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """Get trend analysis for reports"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Get monthly trends for the last 12 months
    monthly_trends = []
    for i in range(12):
        # Calculate month start and end
        current_date = datetime.utcnow()
        month = current_date.month - i
        year = current_date.year
        
        if month <= 0:
            month += 12
            year -= 1
        
        month_start = datetime(year, month, 1)
        if month == 12:
            month_end = datetime(year + 1, 1, 1)
        else:
            month_end = datetime(year, month + 1, 1)
        
        # Count reports for this month
        monthly_reports = ProblemReport.query.filter(
            and_(
                ProblemReport.created_at >= month_start,
                ProblemReport.created_at < month_end
            )
        ).count()
        
        # Count resolved reports for this month
        monthly_resolved = ProblemReport.query.filter(
            and_(
                ProblemReport.resolved_at >= month_start,
                ProblemReport.resolved_at < month_end
            )
        ).count()
        
        monthly_trends.append({
            'month': calendar.month_name[month],
            'year': year,
            'reports': monthly_reports,
            'resolved': monthly_resolved
        })
    
    # Category trends (last 30 days vs previous 30 days)
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    previous_30_days = now - timedelta(days=60)
    
    category_trends = []
    for category in ProblemCategory:
        recent_count = ProblemReport.query.filter(
            and_(
                ProblemReport.category == category,
                ProblemReport.created_at >= last_30_days
            )
        ).count()
        
        previous_count = ProblemReport.query.filter(
            and_(
                ProblemReport.category == category,
                ProblemReport.created_at >= previous_30_days,
                ProblemReport.created_at < last_30_days
            )
        ).count()
        
        change_percent = 0
        if previous_count > 0:
            change_percent = ((recent_count - previous_count) / previous_count) * 100
        
        category_trends.append({
            'category': category.value,
            'recent_count': recent_count,
            'previous_count': previous_count,
            'change_percent': round(change_percent, 2)
        })
    
    return jsonify({
        'monthly_trends': list(reversed(monthly_trends)),
        'category_trends': category_trends
    }), 200

@dashboard_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_performance_metrics():
    """Get performance metrics for officers and overall system"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value not in ['officer', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Officer performance metrics
    officer_performance = []
    officers = User.query.filter(User.role == 'officer').all()
    
    for officer in officers:
        # Get officer's reports in last 30 days
        last_30_days = datetime.utcnow() - timedelta(days=30)
        
        assigned_reports = ProblemReport.query.filter(
            and_(
                ProblemReport.assigned_to == officer.id,
                ProblemReport.created_at >= last_30_days
            )
        ).all()
        
        resolved_reports = [r for r in assigned_reports if r.status == ProblemStatus.RESOLVED]
        
        # Calculate average resolution time
        avg_resolution_time = 0
        if resolved_reports:
            total_time = sum([
                (r.resolved_at - r.created_at).total_seconds() / 3600
                for r in resolved_reports if r.resolved_at
            ])
            avg_resolution_time = total_time / len(resolved_reports)
        
        officer_performance.append({
            'officer_id': officer.id,
            'officer_name': officer.name,
            'assigned_count': len(assigned_reports),
            'resolved_count': len(resolved_reports),
            'resolution_rate': (len(resolved_reports) / len(assigned_reports) * 100) if assigned_reports else 0,
            'avg_resolution_time_hours': round(avg_resolution_time, 2)
        })
    
    # System performance metrics
    total_reports_last_30 = ProblemReport.query.filter(
        ProblemReport.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    resolved_last_30 = ProblemReport.query.filter(
        and_(
            ProblemReport.resolved_at >= datetime.utcnow() - timedelta(days=30),
            ProblemReport.status == ProblemStatus.RESOLVED
        )
    ).count()
    
    system_performance = {
        'total_reports_last_30': total_reports_last_30,
        'resolved_last_30': resolved_last_30,
        'system_resolution_rate': (resolved_last_30 / total_reports_last_30 * 100) if total_reports_last_30 > 0 else 0,
        'pending_reports': ProblemReport.query.filter(
            ProblemReport.status.in_([ProblemStatus.REPORTED, ProblemStatus.ACKNOWLEDGED, ProblemStatus.IN_PROGRESS])
        ).count()
    }
    
    return jsonify({
        'officer_performance': officer_performance,
        'system_performance': system_performance
    }), 200

@dashboard_bp.route('/reports/unassigned', methods=['GET'])
@jwt_required()
def get_unassigned_reports():
    """Get unassigned reports for admin assignment"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.value != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get query parameters
    category = request.args.get('category')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    # Build query for unassigned reports
    query = ProblemReport.query.filter_by(assigned_to=None)
    
    # Filter by category if provided
    if category:
        try:
            category_enum = ProblemCategory(category)
            query = query.filter_by(category=category_enum)
        except ValueError:
            return jsonify({'error': 'Invalid category'}), 400
    
    # Order by creation date (oldest first for priority)
    query = query.order_by(ProblemReport.created_at.asc())
    
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
