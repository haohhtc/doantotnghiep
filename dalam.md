# Tổng hợp những gì đã làm

Đối chiếu theo file `NGHIEP-VU-DMS-THAM-CHIEU.html` (5 nhóm module trong phạm vi đồ án: MDM, Inventory, Sales Order, Purchase Order, Quản trị).

## MDM (Danh mục)

| Nhóm (theo DMS) | Đã làm | Ghi chú |
|---|---|---|
| Geographical | ✅ | Region → Province → District → Ward, cascading dropdown, gắn vào SellingZone/Branch/Customer |
| Sales Organization | ✅ | Vùng bán hàng (Selling Zone). Sales Territory không tách bảng riêng — dùng chung Geography |
| Company Setup | ✅ | Công ty (singleton) → Chi nhánh → Kho, Nhà cung cấp |
| Product | ✅ | Sản phẩm, Nhóm sản phẩm (có phân cấp cha/con), Đơn vị tính + Nhóm quy đổi (UomGroup/UomConversion theo hệ số so với đơn vị gốc), Nhóm thuế, Item-Branch Assignment (2 chiều: theo sản phẩm và theo chi nhánh) |
| Price list | ✅ | Bảng giá (Standard/Channel/Contract), giá theo từng sản phẩm+đơn vị tính, API tra giá tự động (customer → branch → giá gốc), đã wiring vào Sales Order |
| Customers | ✅ | Hồ sơ khách hàng, Nhóm khách hàng, Kênh bán hàng (Account/Channel Definition) |
| Employees | ✅ | Chức vụ (Salesman/SS/ASM), Loại nhân viên bán hàng (Presell/Van Sales/Delivery) — dùng chung bảng `user`, không tách Employee riêng |
| Route & MCP | ✅ | Khung tuyến (Route Master) + Giao tuyến vận hành (Route Setting), gán outlet và salesman theo tuyến |

## Inventory (Kho)

| Nghiệp vụ | Đã làm | Ghi chú |
|---|---|---|
| Inventories (tồn kho hiện tại) | ✅ | |
| Goods Receipt (nhập kho, đã gộp Purchase Order) | ✅ | |
| Stock Counting (kiểm kê) | ✅ | |
| Stock Alerts (cảnh báo tồn thấp) | ✅ | |
| Goods Issue (xuất kho) | ❌ | Còn 100% mock, chưa có bảng/API riêng |
| Inventory Transfer (điều chuyển kho) | ❌ | Còn 100% mock, chưa có bảng/API riêng |

## Sales Order (Bán hàng)

✅ Đã gộp chuỗi Sales Request → Sale Order → Delivery Order thành 1 bảng `sales_order`, xác nhận đơn = xuất kho luôn. Tự động tra giá qua Price List khi chọn sản phẩm.

## Purchase Order (Mua hàng)

✅ Đã gộp vào Goods Receipt (không tách phiếu yêu cầu mua hàng riêng).

## Quản trị

✅ Users (kèm Chi nhánh/Chức vụ/Loại NVBH), Roles/Permissions.

## Hạ tầng chung

- RBAC 3 role: ADMIN, WAREHOUSE_MANAGER, SALES_STAFF — phân quyền theo từng nhóm API trong `SecurityConfig`.
- Hard-delete (xóa thật) thay cho soft-delete ở các danh mục chính (theo yêu cầu tạm thời).
- Sidebar tổ chức theo submenu bám sát cấu trúc module DMS: Vùng địa lý, Sales Organization, Company Setup, Sản phẩm, Bảng giá, Khách hàng, Route & MCP, Nhân viên, Tồn kho, Hệ thống.

## Chưa làm / ngoài phạm vi

- Goods Issue, Inventory Transfer (mock, chưa nối API thật).
- Returns/Credit Memo (DMS gợi ý nên giữ ít nhất 1 chiều, chưa làm).
- Batch Management, Invoices, Promotions, Branch User Assignment — chủ động bỏ theo bảng đối chiếu trong file DMS reference (không nằm trong phạm vi đồ án).
