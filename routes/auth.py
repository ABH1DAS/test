from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import User, OTPVerification, UserRole
from app import db
import random
import string
from datetime import datetime, timedelta
import requests

auth_bp = Blueprint('auth', __name__)

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_sms(phone_number, otp):
    """Send OTP via SMS (implement with Twilio or similar service)"""
    # TODO: Implement actual SMS sending
    print(f"Sending OTP {otp} to {phone_number}")
    return True

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Send OTP to phone number for verification"""
    data = request.get_json()
    phone_number = data.get('phone_number')
    
    if not phone_number:
        return jsonify({'error': 'Phone number is required'}), 400
    
    # Generate OTP
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Save OTP to database
    otp_verification = OTPVerification(
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.session.add(otp_verification)
    db.session.commit()
    
    # Send OTP via SMS
    if send_otp_sms(phone_number, otp_code):
        return jsonify({'message': 'OTP sent successfully'}), 200
    else:
        return jsonify({'error': 'Failed to send OTP'}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and register/login user"""
    data = request.get_json()
    phone_number = data.get('phone_number')
    otp_code = data.get('otp_code')
    name = data.get('name')  # Required for new users
    
    if not phone_number or not otp_code:
        return jsonify({'error': 'Phone number and OTP are required'}), 400
    
    # Find valid OTP
    otp_verification = OTPVerification.query.filter_by(
        phone_number=phone_number,
        otp_code=otp_code,
        is_verified=False
    ).filter(OTPVerification.expires_at > datetime.utcnow()).first()
    
    if not otp_verification:
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    
    # Mark OTP as verified
    otp_verification.is_verified = True
    
    # Check if user exists
    user = User.query.filter_by(phone_number=phone_number).first()
    
    if not user:
        # Create new user
        if not name:
            return jsonify({'error': 'Name is required for new users'}), 400
        
        user = User(
            phone_number=phone_number,
            name=name,
            is_verified=True,
            role=UserRole.CITIZEN
        )
        db.session.add(user)
    else:
        # Update existing user verification status
        user.is_verified = True
    
    db.session.commit()
    
    # Generate JWT tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """Login with Google OAuth"""
    data = request.get_json()
    google_token = data.get('google_token')
    
    if not google_token:
        return jsonify({'error': 'Google token is required'}), 400
    
    # Verify Google token
    try:
        response = requests.get(
            f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={google_token}'
        )
        google_data = response.json()
        
        if 'error' in google_data:
            return jsonify({'error': 'Invalid Google token'}), 400
        
        google_id = google_data.get('id')
        email = google_data.get('email')
        name = google_data.get('name')
        
        # Check if user exists
        user = User.query.filter_by(google_id=google_id).first()
        
        if not user:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                phone_number=f"google_{google_id}",  # Temporary phone number
                is_verified=True,
                role=UserRole.CITIZEN
            )
            db.session.add(user)
            db.session.commit()
        
        # Generate JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to verify Google token'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token}), 200
