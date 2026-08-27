# Đề xuất đề tài khóa luận tốt nghiệp

**Tên đề tài:** Xây dựng hệ thống ERP về quản lý kho thông minh

**Nhóm:** 2 thành viên · **Công nghệ chính:** Java

## Mục tiêu

Xây dựng hệ thống quản lý kho thông minh nhằm hỗ trợ doanh nghiệp kiểm soát và tối ưu lượng hàng tồn kho, nâng cao hiệu quả quản lý nhập – xuất – bán hàng, hạn chế tình trạng thiếu hàng, tồn kho quá mức và các biến động bất thường trong quá trình vận hành.

Hệ thống thu thập và phân tích dữ liệu hoạt động của doanh nghiệp để cung cấp:
- Báo cáo trực quan (BI dashboard)
- Dự báo nhu cầu sản phẩm trong tương lai (Forecasting)
- Cảnh báo rủi ro tồn kho (Stock Risk)
- Hỗ trợ nhà quản lý ra quyết định nhập hàng (AI Chatbot)

## Phạm vi chức năng (tóm tắt)

1. **Quản lý hệ thống** — Đăng nhập/đăng xuất, quản lý & phân quyền người dùng
2. **Quản lý danh mục** — Sản phẩm, danh mục sản phẩm, nhà cung cấp, kho
3. **Quản lý nhập hàng** — Phiếu nhập, chi tiết phiếu nhập, cập nhật tồn kho, lịch sử nhập
4. **Quản lý bán hàng** — Xem/chọn sản phẩm, tạo đơn hàng, xác nhận/hủy đơn, xuất kho tự động
5. **Quản lý tồn kho** — Tồn hiện tại, lịch sử nhập/xuất, kiểm kê/điều chỉnh, cảnh báo sắp hết hàng
6. **Data Warehouse & ETL** — Fact/Dimension: Sản phẩm, Nhà cung cấp, Kho, Thời gian, Giao dịch nhập/xuất, Tồn kho, Bán hàng
7. **Business Intelligence** — Dashboard Power BI: tổng quan kho, doanh thu, nhập/xuất theo thời gian, tồn kho, sản phẩm bán chạy/tồn lâu, phân tích nhà cung cấp, xu hướng
8. **Chức năng AI** — Forecasting (7/14/30 ngày), Stock Risk, Anomaly Detection, AI Chatbot hỏi-đáp

Chi tiết đầy đủ từng chức năng: xem [`../01-requirements/functional-requirements.md`](../01-requirements/functional-requirements.md)

## Kiến trúc tổng quát

```
Hệ thống quản lý kho Java → MySQL → ETL → Data Warehouse → BI + AI
```

## Phân công thành viên

| Thành viên | Phụ trách |
|---|---|
| 1 | Java Backend, API, chức năng quản lý kho/bán hàng |
| 2 | Data Warehouse, ETL, BI, Forecasting, Anomaly Detection, AI Chatbot |
| Cả hai | Tích hợp, kiểm thử, báo cáo, triển khai |

## Ghi chú tham khảo

Về tổ chức module quản lý nghiệp vụ và giao diện, dự án tham khảo cách tổ chức của hệ thống DMS hiện có (phân nhóm theo domain nghiệp vụ: Master data, Trade Marketing, ... và phong cách UI dạng lưới dữ liệu quản trị). Giao diện thực tế do nhóm tự thiết kế dựa trên tinh thần đó, không sao chép mã nguồn DMS.
