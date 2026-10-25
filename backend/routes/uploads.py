
"""Admin file uploads to MongoDB GridFS + public file serving."""
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from auth import require_staff
from storage import APP_NAME, get_object

router = APIRouter()

ALLOWED_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "pdf": "application/pdf",
}
MAX_SIZE = 15 * 1024 * 1024  # 15 MB


@router.post("/admin/uploads", tags=["admin"])
async def upload_file(file: UploadFile = File(...), staff=Depends(require_staff)):
    from server import db

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    content_type = ALLOWED_TYPES.get(ext)
    if not content_type:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, WEBP or PDF files are allowed",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 15 MB)")

    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="uploads")
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"

    gridfs_id = await bucket.upload_from_stream(
        file.filename,
        data,
        metadata={
            "contentType": content_type,
            "storage_path": path,
        },
    )

    try:
        await db.files.insert_one({
            "id": str(uuid.uuid4()),
            "storage_path": path,
            "gridfs_id": str(gridfs_id),
            "original_filename": file.filename,
            "content_type": content_type,
            "size": len(data),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        # Avoid leaving an orphaned GridFS file if metadata insertion fails.
        await bucket.delete(gridfs_id)
        raise

    return {
        "path": path,
        "url": f"/api/files/{path}",
        "size": len(data),
    }


@router.get("/files/{path:path}", tags=["public"])
async def serve_file(path: str):
    from server import db

    record = await db.files.find_one({
        "storage_path": path,
        "is_deleted": False,
    })
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    # New files are served directly from MongoDB GridFS.
    if record.get("gridfs_id"):
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="uploads")
        try:
            grid_out = await bucket.open_download_stream(
                ObjectId(record["gridfs_id"])
            )
            data = await grid_out.read()
            content_type = record.get(
                "content_type",
                "application/octet-stream",
            )
        except Exception:
            raise HTTPException(status_code=404, detail="Stored file not found")
    else:
        # Temporary compatibility for files uploaded before the migration.
        # These records still depend on the legacy storage service.
        try:
            data, content_type = get_object(path)
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Legacy file is unavailable; re-upload it through the admin panel",
            )

    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
