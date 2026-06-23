import os
from app.core.config import settings

def get_document_storage_size_bytes() -> int:
        """
        Quét thư mục lưu trữ file vật lý trên Server để tính tổng dung lượng file gốc.
        Nếu em dùng Object Storage (MinIO/S3), thay bằng hàm đếm tổng size của Bucket.
        """
        total_size = 0
        upload_dir = settings.UPLOAD_DIR
        if not os.path.exists(upload_dir):
            return 0
            
        for dirpath, _, filenames in os.walk(upload_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                # Bỏ qua các liên kết tượng trưng (symlink) bị hỏng nếu có
                if os.path.exists(fp):
                    total_size += os.path.getsize(fp)
        return total_size
