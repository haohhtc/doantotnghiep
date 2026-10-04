"""Nhap du lieu hanh chinh THAT cho 3 tinh/thanh dang dung (TP.HCM, Ha Noi, Da Nang), theo
chuan MOI sau sap nhap 1/7/2025 (Nghi quyet UBTVQH15): ca nuoc con 34 tinh/thanh, KHONG CON
cap Quan/Huyen - chi con Tinh/Thanh -> Phuong/Xa truc tiep.

Nguon du lieu (chinh thuc, tra cuu ngay 2026-10-04):
  - TP.HCM (168 don vi): baodientu Dai bieu Nhan dan - sap nhap voi Binh Duong + Ba Ria-Vung Tau
  - Ha Noi (126 don vi): LuatVietnam, theo Nghi quyet 1656/NQ-UBTVQH15
  - Da Nang (94 don vi): tong hop tu thuvienphapluat.vn + tuoitre.vn - sap nhap voi Quang Nam

Gioi han da biet: bang 'district' trong schema hien tai (OLTP) van con cap Quan/Huyen (thiet
ke truoc sap nhap). Vi chuan moi KHONG CON cap nay nhung FK ward.district_id la NOT NULL,
script tao 1 "district cau noi" duy nhat/tinh (ten co ghi ro "truc thuoc ... - khong qua
quan/huyen") de khop schema ma khong bia du lieu quan/huyen khong co that.

CACH CHAY: cd scripts && python seed_geography.py
"""
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


def env(key, default=None):
    return os.getenv(key, default)


def build_engine():
    user = env("OLTP_DB_USER", "erp_user")
    pwd = env("OLTP_DB_PASSWORD", "erp_password")
    host = env("OLTP_DB_HOST", "localhost")
    port = env("OLTP_DB_PORT", "3306")
    name = env("OLTP_DB_NAME", "erp_qlkho_oltp")
    return create_engine(f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4")


REGIONS = [
    ("MB", "Mien Bac"),
    ("MT", "Mien Trung"),
    ("MN", "Mien Nam"),
]

# (ma tinh, ten tinh, ma vung)
PROVINCES = [
    ("HCM", "Thanh pho Ho Chi Minh", "MN"),
    ("HN", "Thanh pho Ha Noi", "MB"),
    ("DN", "Thanh pho Da Nang", "MT"),
]

# 1 district cau noi / tinh (xem docstring)
DISTRICTS = [
    ("HCM-TT", "Truc thuoc TP.HCM (khong qua quan/huyen - chuan sau sap nhap 2025)", "HCM"),
    ("HN-TT", "Truc thuoc TP. Ha Noi (khong qua quan/huyen - chuan sau sap nhap 2025)", "HN"),
    ("DN-TT", "Truc thuoc TP. Da Nang (khong qua quan/huyen - chuan sau sap nhap 2025)", "DN"),
]

# ============================================================================
# PHUONG/XA - TP. HO CHI MINH (168 - gom ca khu vuc Binh Duong, Ba Ria - Vung Tau cu)
# ============================================================================
HCM_PHUONG = [
    "Hiep Binh", "Tam Binh", "Thu Duc", "Linh Xuan", "Long Binh", "Tang Nhon Phu", "Phuoc Long",
    "Long Phuoc", "Long Truong", "An Khanh", "Binh Trung", "Cat Lai",
    "Tan Dinh", "Ben Thanh", "Sai Gon", "Cau Ong Lanh",
    "Ban Co", "Xuan Hoa", "Nhieu Loc",
    "Vinh Hoi", "Khanh Hoi", "Xom Chieu",
    "Cho Quan", "An Dong", "Cho Lon",
    "Binh Tien", "Binh Phu", "Phu Lam", "Binh Tay",
    "Tan My", "Tan Hung", "Tan Thuan", "Phu Thuan",
    "Chanh Hung", "Binh Dong", "Phu Dinh",
    "Vuon Lai", "Dien Hong", "Hoa Hung",
    "Hoa Binh", "Phu Tho", "Binh Thoi", "Minh Phung",
    "Dong Hung Thuan", "Trung My Tay", "Tan Thoi Hiep", "Thoi An", "An Phu Dong",
    "Gia Dinh", "Binh Thanh", "Binh Loi Trung", "Thanh My Tay", "Binh Quoi",
    "Binh Tan", "Binh Hung Hoa", "Binh Tri Dong", "An Lac", "Tan Tao",
    "Hanh Thong", "An Nhon", "Go Vap", "Thong Tay Hoi", "An Hoi Tay", "An Hoi Dong",
    "Duc Nhuan", "Cau Kieu", "Phu Nhuan",
    "Tan Son Hoa", "Tan Son Nhat", "Tan Hoa", "Bay Hien", "Tan Binh", "Tan Son",
    "Tay Thanh", "Tan Son Nhi", "Phu Tho Hoa", "Phu Thanh", "Tan Phu",
    "Dong Hoa", "Di An", "Tan Dong Hiep",
    "Thuan An", "Thuan Giao", "Binh Hoa", "Lai Thieu", "An Phu",
    "Binh Duong", "Chanh Hiep", "Thu Dau Mot", "Phu Loi", "Phu An",
    "Vinh Tan", "Binh My", "Tan Uyen", "Tan Hiep", "Tan Khanh",
    "Tay Nam", "Long Nguyen", "Ben Cat", "Chanh Phu Hoa", "Thoi Hoa", "Hoa Loi",
    "Vung Tau", "Tam Thang", "Rach Dua", "Phuoc Thang", "Long Son",
    "Ba Ria", "Long Huong", "Tam Long",
    "Phu My", "Tan Thanh", "Tan Phuoc", "Tan Hai", "Chau Pha",
]
HCM_XA = [
    "Vinh Loc", "Tan Vinh Loc", "Binh Loi", "Tan Nhut", "Binh Chanh", "Hung Long", "Binh Hung",
    "An Nhon Tay", "Thai My", "Nhuan Duc", "Tan An Hoi", "Cu Chi", "Phu Hoa Dong", "Binh My (Cu Chi)",
    "Binh Khanh", "Can Gio", "An Thoi Dong", "Dao Thanh An",
    "Hoc Mon", "Ba Diem", "Xuan Thoi Son", "Dong Thanh",
    "Nha Be", "Hiep Phuoc",
    "Bac Tan Uyen", "Thuong Tan",
    "An Long", "Phuoc Thanh", "Phuoc Hoa", "Phu Giao",
    "Tru Van Tho", "Bau Bang",
    "Minh Thanh", "Long Hoa", "Dau Tieng", "Thanh An",
    "Ngai Giao", "Binh Gia", "Kim Long", "Chau Duc", "Xuan Son", "Nghia Thanh",
    "Ho Tram", "Xuyen Moc", "Hoa Hoi", "Bau Lam", "Binh Chau", "Hoa Hiep",
    "Dat Do", "Long Hai", "Long Dien", "Phuoc Hai",
]
HCM_DAC_KHU = ["Con Dao"]

# ============================================================================
# PHUONG/XA - HA NOI (126)
# ============================================================================
HN_PHUONG = [
    "Hoan Kiem", "Cua Nam", "Ba Dinh", "Ngoc Ha", "Giang Vo", "Hai Ba Trung", "Vinh Tuy",
    "Bach Mai", "Dong Da", "Kim Lien", "Van Mieu - Quoc Tu Giam", "Lang", "O Cho Dua", "Hong Ha",
    "Hoang Mai", "Tuong Mai", "Dinh Cong", "Yen So", "Thanh Xuan", "Khuong Dinh", "Phuong Liet",
    "Cau Giay", "Nghia Do", "Yen Hoa", "Tay Ho", "Phu Thuong", "Tu Liem", "Xuan Phuong",
    "Tay Mo", "Dai Mo", "Long Bien", "Bo De", "Viet Hung", "Phuc Loi", "Ha Dong", "Duong Noi",
    "Yen Nghia", "Phu Luong", "Kien Hung", "Chuong My", "Son Tay", "Tung Thien",
]
HN_XA = [
    "Linh Nam", "Vinh Hung", "Hoang Liet", "Tay Tuu", "Phu Dien", "Xuan Dinh", "Dong Ngac",
    "Thuong Cat", "Thanh Liet", "Thanh Tri", "Dai Thanh", "Nam Phu", "Ngoc Hoi", "Thuong Phuc",
    "Thuong Tin", "Chuong Duong", "Hong Van", "Phu Xuyen", "Phuong Duc", "Chuyen My", "Dai Xuyen",
    "Thanh Oai", "Binh Minh", "Tam Hung", "Dan Hoa", "Van Dinh", "Ung Thien", "Hoa Xa", "Ung Hoa",
    "My Duc", "Hong Son", "Phuc Son", "Huong Son", "Phu Nghia", "Xuan Mai", "Tran Phu", "Hoa Phu",
    "Quang Bi", "Minh Chau", "Quang Oai", "Vat Lai", "Co Do", "Bat Bat", "Suoi Hai", "Ba Vi",
    "Yen Bai (Ba Vi)", "Doai Phuong", "Phuc Tho", "Phuc Loc", "Hat Mon", "Thach That", "Ha Bang",
    "Tay Phuong", "Hoa Lac", "Yen Xuan", "Quoc Oai", "Hung Dao", "Kieu Phu", "Phu Cat", "Hoai Duc",
    "Duong Hoa", "Son Dong", "An Khanh", "Dan Phuong", "O Dien", "Lien Minh", "Gia Lam", "Thuan An",
    "Bat Trang", "Phu Dong", "Thu Lam", "Dong Anh", "Phuc Thinh", "Thien Loc", "Vinh Thanh",
    "Me Linh", "Yen Lang", "Tien Thang", "Quang Minh", "Soc Son", "Da Phuc", "Noi Bai",
    "Trung Gia", "Kim Anh",
]

# ============================================================================
# PHUONG/XA - DA NANG (94 - gom ca khu vuc Quang Nam cu)
# ============================================================================
DN_PHUONG = [
    "Tam Ky", "Quang Phu", "Huong Tra", "Ban Thach", "Dien Ban", "Dien Ban Dong", "An Thang",
    "Dien Ban Bac", "Hoi An", "Hoi An Dong", "Hoi An Tay", "Hai Chau", "Hoa Cuong", "Thanh Khe",
    "An Khe", "An Hai", "Son Tra", "Ngu Hanh Son", "Hoa Khanh", "Hai Van", "Lien Chieu",
    "Cam Le", "Hoa Xuan",
]
DN_XA = [
    "Nui Thanh", "Tam My", "Tam Anh", "Duc Phu", "Tam Xuan", "Tay Ho", "Chien Dan", "Phu Ninh",
    "Lanh Ngoc", "Tien Phuoc", "Thanh Binh", "Son Cam Ha", "Tra Lien", "Tra Giap", "Tra Tan",
    "Tra Doc", "Tra My", "Nam Tra My", "Tra Tap", "Tra Van", "Tra Linh", "Tra Leng", "Thang Binh",
    "Thang An", "Thang Truong", "Thang Dien", "Thang Phu", "Dong Duong", "Que Son Trung",
    "Que Son", "Xuan Phu", "Nong Son", "Que Phuoc", "Duy Nghia", "Nam Phuoc", "Duy Xuyen",
    "Thu Bon", "Dien Ban Tay", "Go Noi", "Dai Loc", "Ha Nha", "Thuong Duc", "Vu Gia", "Phu Thuan",
    "Thanh My", "Ben Giang", "Nam Giang", "Dac Pring", "La Dee", "La Ee", "Song Vang", "Song Kon",
    "Dong Giang", "Ben Hien", "Avuong", "Tay Giang", "Hung Son", "Hiep Duc", "Viet An", "Phuoc Tra",
    "Kham Duc", "Phuoc Nang", "Phuoc Chanh", "Phuoc Thanh", "Phuoc Hiep", "Tam Hai", "Tan Hiep",
    "Hoa Vang", "Hoa Tien", "Ba Na",
]
DN_DAC_KHU = ["Hoang Sa"]


def build_wards():
    """Tra ve list (name, loai, ma_tinh) cho toan bo 388 phuong/xa/dac khu."""
    wards = []
    for name in HCM_PHUONG:
        wards.append((f"Phuong {name}", "HCM"))
    for name in HCM_XA:
        wards.append((f"Xa {name}", "HCM"))
    for name in HCM_DAC_KHU:
        wards.append((f"Dac khu {name}", "HCM"))

    for name in HN_PHUONG:
        wards.append((f"Phuong {name}", "HN"))
    for name in HN_XA:
        wards.append((f"Xa {name}", "HN"))

    for name in DN_PHUONG:
        wards.append((f"Phuong {name}", "DN"))
    for name in DN_XA:
        wards.append((f"Xa {name}", "DN"))
    for name in DN_DAC_KHU:
        wards.append((f"Dac khu {name}", "DN"))

    return wards


def main():
    engine = build_engine()
    wards = build_wards()
    print(f"Tong so phuong/xa/dac khu se nhap: {len(wards)}")

    with engine.begin() as conn:
        existing = conn.execute(text("SELECT COUNT(*) FROM ward")).scalar()
        if existing:
            print(f"Bang 'ward' da co {existing} dong (du lieu test cu, chuan truoc sap nhap 2025, "
                  f"chua co branch/customer nao thuc su tham chieu) - xoa de nhap lai theo chuan moi.")
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            conn.execute(text("UPDATE customer SET region_id=NULL, province_id=NULL, district_id=NULL, ward_id=NULL"))
            conn.execute(text("UPDATE branch SET region_id=NULL, province_id=NULL, district_id=NULL, ward_id=NULL"))
            for t in ["ward", "district", "province", "region"]:
                conn.execute(text(f"DELETE FROM {t}"))
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

        region_id = {}
        for code, name in REGIONS:
            r = conn.execute(text("INSERT INTO region (code, name) VALUES (:c, :n)"), {"c": code, "n": name})
            region_id[code] = r.lastrowid

        province_id = {}
        for code, name, region_code in PROVINCES:
            r = conn.execute(
                text("INSERT INTO province (code, name, region_id) VALUES (:c, :n, :r)"),
                {"c": code, "n": name, "r": region_id[region_code]},
            )
            province_id[code] = r.lastrowid

        district_id = {}
        for code, name, province_code in DISTRICTS:
            r = conn.execute(
                text("INSERT INTO district (code, name, province_id) VALUES (:c, :n, :p)"),
                {"c": code, "n": name, "p": province_id[province_code]},
            )
            district_id[province_code] = r.lastrowid

        count_by_province = {"HCM": 0, "HN": 0, "DN": 0}
        for i, (name, province_code) in enumerate(wards, start=1):
            count_by_province[province_code] += 1
            code = f"{province_code}-W{count_by_province[province_code]:03d}"
            conn.execute(
                text("INSERT INTO ward (code, name, district_id) VALUES (:c, :n, :d)"),
                {"c": code, "n": name, "d": district_id[province_code]},
            )

    print("Da nhap xong:")
    print(f"  {len(REGIONS)} vung, {len(PROVINCES)} tinh/thanh, {len(DISTRICTS)} district cau noi")
    for p, n in count_by_province.items():
        print(f"  {p}: {n} phuong/xa/dac khu")


if __name__ == "__main__":
    main()
