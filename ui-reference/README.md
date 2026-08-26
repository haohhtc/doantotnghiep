# UI Reference

Screenshot chụp từ hệ thống DMSpro OMS thật (môi trường QC nội bộ công ty, tenant BEL) — dùng làm **tham khảo bố cục/phong cách giao diện** khi code Frontend cho đồ án. Không copy code, chỉ tham khảo cách bố trí menu/bảng/filter/nút bấm.

> ⚠️ **Lưu ý bảo mật:** 2 ảnh `03-ban-hang/don-hang-salesorder.png` và `05-he-thong/quan-ly-nguoi-dung-users.png` có chứa dữ liệu thật (tên/địa chỉ khách hàng, tên/email/SĐT nhân viên) — giữ theo yêu cầu của người tạo đồ án. **Không đăng ảnh này lên nơi công khai** (báo cáo khóa luận public, GitHub public repo...) nếu chưa che thông tin cá nhân.

## Danh sách ảnh → chức năng đồ án

| Ảnh | Chức năng trong đồ án | Màn hình thật (tham khảo) |
|---|---|---|
| `00-dang-nhap/dang-nhap-login.png` | SYS-01 Đăng nhập | Trang login OMS |
| `01-danh-muc/san-pham-itemmasters.png` | CAT-01 Quản lý sản phẩm | MDM › Product › Items |
| `01-danh-muc/danh-muc-san-pham-itemgroup.png` | CAT-02 Quản lý danh mục sản phẩm | MDM › Product › Item Group |
| `01-danh-muc/nha-cung-cap-vendors.png` | CAT-03 Quản lý nhà cung cấp | MDM › Company Setup › Vendors |
| `01-danh-muc/kho-warehouse.png` | CAT-04 Quản lý kho | MDM › Company Setup › Warehouse |
| `02-nhap-hang/phieu-nhap-goodsreceipt.png` | IN-01..04 Quản lý nhập hàng | Inventory › Goods Receipt |
| `03-ban-hang/don-hang-salesorder.png` ⚠️ | SALE-01..05 Quản lý bán hàng | Sales Order › Sale Orders |
| `04-ton-kho/phieu-xuat-goodsissue.png` | Tham khảo xuất kho (liên quan SALE-05) | Inventory › Goods Issue |
| `04-ton-kho/bao-cao-ton-kho-thuc-te.png` | INV-01 Theo dõi tồn hiện tại | Report › Inventory Actual Report |
| `04-ton-kho/dieu-chuyen-kho-inventorytransfer.png` | Tham khảo thêm (không bắt buộc trong scope) | Inventory › Inventory Transfer for Branch |
| `04-ton-kho/kiem-ke-stockcounting.png` | INV-04 Kiểm kê/điều chỉnh tồn kho | Trade Marketing › Stock Countings |
| `05-he-thong/phan-quyen-roles.png` | SYS-04 Phân quyền người dùng | Administration › Identity › Roles |
| `05-he-thong/quan-ly-nguoi-dung-users.png` ⚠️ | SYS-03 Quản lý người dùng | Administration › Identity › Users |

Field cụ thể quan sát được từ mỗi màn hình đã đưa vào thiết kế bảng ở `../backend/src/main/resources/db/migration/V2__..V5__*.sql` (VD: Vendor có Code/Name/Foreign Name/Phone/Email/Address/Active; Warehouse có thêm Whse Type Main/Van/Damage/Consignment).

## Popup "Tạo mới"

Mỗi màn hình (trừ login + report tồn kho) có thêm ảnh `*-tao-moi.png` chụp popup Create — thấy rõ field/tab của form nhập liệu (VD: `san-pham-itemmasters-tao-moi.png` có 6 tab General/Inventory/Purchasing/Sales/Attribute/Image Sample). Không có dữ liệu nào được lưu khi chụp các ảnh này.

Thêm 3 màn MDM: `khach-hang-customerprofile`, `don-vi-tinh-uoms`, `nhom-don-vi-tinh-uomgroups` (Customer/UOM liên quan trực tiếp field `customer`, `product.unit` trong schema).

## Ghi chú

- Chưa tìm được đúng URL cho 1 số màn hình phụ (VD "current stock balance" tách riêng khỏi report) — 12 ảnh trên là những gì khớp gần nhất với scope đồ án, không nhất thiết đúng 100% tên module thật.
- `capture-manifest.json` trong cùng thư mục ghi lại URL thật đã chụp, để tra cứu lại khi cần.
