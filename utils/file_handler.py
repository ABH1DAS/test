import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
import boto3
from botocore.exceptions import ClientError

class FileHandler:
    """Handle file uploads to local storage or S3"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'}
    
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in FileHandler.ALLOWED_EXTENSIONS
    
    @staticmethod
    def upload_to_s3(file, bucket_name, folder="uploads"):
        """Upload file to S3 bucket"""
        if not FileHandler.allowed_file(file.filename):
            return None
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        object_name = f"{folder}/{unique_filename}"
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=current_app.config.get('AWS_SECRET_ACCESS_KEY')
        )
        
        try:
            s3_client.upload_fileobj(file, bucket_name, object_name)
            return f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
        except ClientError as e:
            print(f"S3 upload error: {e}")
            return None
    
    @staticmethod
    def save_locally(file, folder="uploads"):
        """Save file to local storage"""
        if not FileHandler.allowed_file(file.filename):
            return None
        
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        return f"/uploads/{folder}/{unique_filename}"
    
    @staticmethod
    def upload_file(file, folder="uploads"):
        """Upload file with S3 fallback to local storage"""
        if not file or not FileHandler.allowed_file(file.filename):
            return None
        
        # Try S3 first if configured
        if current_app.config.get('AWS_S3_BUCKET'):
            s3_url = FileHandler.upload_to_s3(
                file, 
                current_app.config['AWS_S3_BUCKET'], 
                folder
            )
            if s3_url:
                return s3_url
        
        # Fallback to local storage
        return FileHandler.save_locally(file, folder)
