import os
from typing import Optional
import geoip2.database
from app.core.logging import logger

class GeoIPService:
    def __init__(self):
        self._reader: Optional[geoip2.database.Reader] = None

    def initialize(self, db_path: str):
        """Khởi tạo và nạp database vào bộ nhớ khi ứng dụng Start."""
        if not os.path.exists(db_path):
            logger.error(f"Không tìm thấy file database GeoIP2 tại: {db_path}")
            # Không raise lỗi nếu muốn hệ thống vẫn chạy khi thiếu định vị, 
            # hoặc raise tùy theo độ nghiêm trọng của business.
            self._reader = None
            return
        
        try:
            # Khởi tạo Reader object độc lập
            self._reader = geoip2.database.Reader(db_path)
            logger.info("Nạp cơ sở dữ liệu GeoIP2 City Offline thành công.")
        except Exception as e:
            logger.error(f"Lỗi khi cấu hình GeoIP2 Reader: {str(e)}")
            self._reader = None

    def get_location(self, ip_address: str) -> str:
        """Phân tích IP và trả về tên Thành phố bằng tiếng Anh/Việt."""
        if not self._reader:
            return "Unknown Location"
        
        # Xử lý các dải IP nội bộ/địa phương nhanh để đỡ tốn tài nguyên truy vấn file
        if (
            ip_address in ("127.0.0.1", "::1", "localhost")
            or ip_address.startswith("192.168.")
            or ip_address.startswith("172.")
        ):
            return "Local Network (Internal)"

        try:
            # Truy vấn file mmdb bằng thư viện geoip2
            response = self._reader.city(ip_address)
            
            # Ưu tiên lấy tên thành phố (City Name)
            city_name = response.city.name
            country_name = response.country.name
            
            if city_name and country_name:
                return f"{city_name}, {country_name}"
            elif country_name:
                return country_name
            return "Unknown Location"
            
        except geoip2.errors.AddressNotFoundError:
            # Trường hợp IP hợp lệ nhưng không nằm trong database (ví dụ IP ảo, IP test)
            return "Unknown Location"
        except Exception as e:
            logger.error(f"Lỗi phân tích IP {ip_address}: {str(e)}")
            return "Unknown Location"

    def close(self):
        """Đóng Reader giải phóng tài nguyên hệ thống."""
        if self._reader:
            self._reader.close()
            logger.info("Đã đóng kết nối GeoIP2 Reader an toàn.")

# Khởi tạo một thực thể Singleton dùng chung toàn hệ thống
geoip_service = GeoIPService()