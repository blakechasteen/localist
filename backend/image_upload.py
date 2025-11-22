"""
Image Upload to Cloudflare R2

Handles image uploads with automatic optimization and CDN delivery
"""

import boto3
from botocore.client import Config
from fastapi import UploadFile, HTTPException
import os
from PIL import Image
import io
from typing import Optional
import uuid
from datetime import datetime

# Cloudflare R2 Configuration
# Get these from your Cloudflare dashboard
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "your-account-id")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "your-access-key")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "your-secret-key")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "localist-images")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://images.localist.app")  # Your R2 public URL

# Initialize S3 client (R2 is S3-compatible)
s3_client = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto'  # R2 doesn't use regions
)

# Allowed image types
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Image optimization settings
THUMBNAIL_SIZE = (400, 400)
MEDIUM_SIZE = (800, 800)
LARGE_SIZE = (1600, 1600)


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def optimize_image(image_data: bytes, max_size: tuple, quality: int = 85) -> bytes:
    """
    Optimize image by resizing and compressing.

    Args:
        image_data: Original image bytes
        max_size: Maximum dimensions (width, height)
        quality: JPEG quality (1-100)

    Returns:
        Optimized image bytes
    """
    # Open image
    img = Image.open(io.BytesIO(image_data))

    # Convert RGBA to RGB if necessary
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])  # 3 is the alpha channel
        img = background

    # Resize if needed
    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    # Save optimized image
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    output.seek(0)

    return output.read()


async def upload_image(
    file: UploadFile,
    folder: str = "general",
    generate_thumbnails: bool = True
) -> dict:
    """
    Upload image to Cloudflare R2 with automatic optimization.

    Args:
        file: Uploaded file from FastAPI
        folder: Folder to organize images (e.g., 'businesses', 'products', 'profiles')
        generate_thumbnails: Whether to generate thumbnail and medium versions

    Returns:
        dict with URLs: {
            "original": "https://...",
            "large": "https://...",
            "medium": "https://...",
            "thumbnail": "https://..."
        }
    """
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    base_filename = f"{folder}/{timestamp}/{unique_id}"

    urls = {}

    try:
        # Upload original (as large)
        large_key = f"{base_filename}_large.jpg"
        large_data = optimize_image(contents, LARGE_SIZE, quality=90)

        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=large_key,
            Body=large_data,
            ContentType='image/jpeg',
            CacheControl='public, max-age=31536000',  # 1 year
        )
        urls['large'] = f"{R2_PUBLIC_URL}/{large_key}"
        urls['original'] = urls['large']  # Use large as original

        if generate_thumbnails:
            # Generate and upload medium version
            medium_key = f"{base_filename}_medium.jpg"
            medium_data = optimize_image(contents, MEDIUM_SIZE, quality=85)

            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=medium_key,
                Body=medium_data,
                ContentType='image/jpeg',
                CacheControl='public, max-age=31536000',
            )
            urls['medium'] = f"{R2_PUBLIC_URL}/{medium_key}"

            # Generate and upload thumbnail
            thumbnail_key = f"{base_filename}_thumb.jpg"
            thumbnail_data = optimize_image(contents, THUMBNAIL_SIZE, quality=80)

            s3_client.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=thumbnail_key,
                Body=thumbnail_data,
                ContentType='image/jpeg',
                CacheControl='public, max-age=31536000',
            )
            urls['thumbnail'] = f"{R2_PUBLIC_URL}/{thumbnail_key}"

        return urls

    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload image"
        )


async def delete_image(image_url: str):
    """
    Delete image from R2.

    Args:
        image_url: Full URL of the image to delete
    """
    try:
        # Extract key from URL
        key = image_url.replace(R2_PUBLIC_URL + "/", "")

        s3_client.delete_object(
            Bucket=R2_BUCKET_NAME,
            Key=key
        )

        # Also delete related sizes if they exist
        base_key = key.rsplit('_', 1)[0]
        for suffix in ['_large.jpg', '_medium.jpg', '_thumb.jpg']:
            try:
                s3_client.delete_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=base_key + suffix
                )
            except:
                pass  # Ignore if doesn't exist

    except Exception as e:
        print(f"Error deleting image: {e}")
        # Don't raise exception - deletion failures shouldn't break the app


# Alternative: Local Storage for Development
LOCAL_UPLOAD_DIR = "uploads"

async def upload_image_local(file: UploadFile, folder: str = "general") -> dict:
    """
    Upload image to local filesystem (for development).

    In production, use upload_image() with Cloudflare R2.
    """
    import os
    from pathlib import Path

    # Create upload directory
    upload_path = Path(LOCAL_UPLOAD_DIR) / folder
    upload_path.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}.{file_ext}"

    # Save file
    file_path = upload_path / filename
    contents = await file.read()

    with open(file_path, 'wb') as f:
        f.write(contents)

    # Return URL (assuming you're serving static files from /uploads)
    url = f"/uploads/{folder}/{filename}"

    return {
        "original": url,
        "large": url,
        "medium": url,
        "thumbnail": url,
    }
