package com.erpqlkho.backend.auth.security;

import java.util.List;

// Nguon DUY NHAT dinh nghia toan bo quyen chi tiet (trang x hanh dong) cho he thong Phan quyen moi
// (xem Users/index.jsx nut "Phan quyen") - Frontend doc lai dung catalog nay qua GET
// /api/permissions/catalog (PermissionController) de ve cay checkbox, KHONG tu dinh nghia rieng,
// tranh lech du lieu. Ma quyen dang "page:action" (vd "sales_order:confirm"), nap thanh
// GrantedAuthority tien to "PERM_" trong CustomUserDetailsService. Chi bao phu 7 nhom uu tien
// (Ban hang/Giao hang/Hoa don/Tra hang/Kho/Danh muc/He thong) - cac trang khac van dung Role nhu cu,
// KHONG doi (xem SecurityConfig.java).
public class PermissionCatalog {

    public record PageDef(String code, String label, List<String> actions) {
    }

    public record GroupDef(String code, String label, List<PageDef> pages) {
    }

    private static final List<String> CRUD = List.of("view", "create", "edit", "delete");
    private static final List<String> VIEW_EDIT = List.of("view", "edit");

    public static final List<GroupDef> GROUPS = List.of(
            new GroupDef("SALES", "Bán hàng", List.of(
                    new PageDef("sales_order", "Đơn hàng bán", List.of("view", "create", "edit", "confirm", "cancel", "delete")),
                    new PageDef("sales_request", "Yêu cầu bán hàng", List.of("view", "create", "edit", "confirm", "delete")))),

            new GroupDef("DELIVERY", "Giao hàng", List.of(
                    new PageDef("delivery_order", "Đơn giao hàng", List.of("view", "create", "edit", "confirm", "cancel", "delete")))),

            new GroupDef("INVOICE", "Hóa đơn", List.of(
                    new PageDef("invoice", "Hóa đơn", List.of("view", "create", "cancel")))),

            new GroupDef("RETURNS", "Trả hàng", List.of(
                    new PageDef("sales_return", "Trả hàng khách", List.of("view", "create", "edit", "confirm", "cancel", "delete")),
                    new PageDef("purchase_return", "Trả hàng NCC", List.of("view", "create", "edit", "confirm", "delete")))),

            new GroupDef("INVENTORY", "Kho", List.of(
                    new PageDef("goods_receipt", "Phiếu nhập hàng", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("goods_issue", "Phiếu xuất kho", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("inventory_transfer", "Chuyển kho", List.of("view", "create", "edit", "confirm_send", "confirm_receive", "delete")),
                    new PageDef("stock_take", "Kiểm kê kho", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("stock_receipt", "Phiếu nhập kho khác", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("stock", "Tồn kho", List.of("view")))),

            new GroupDef("CATALOG", "Danh mục", List.of(
                    new PageDef("product", "Sản phẩm", CRUD),
                    new PageDef("product_category", "Thuộc tính sản phẩm", CRUD),
                    new PageDef("product_group", "Nhóm sản phẩm", CRUD),
                    new PageDef("customer", "Khách hàng", CRUD),
                    new PageDef("customer_group", "Nhóm khách hàng", CRUD),
                    new PageDef("customer_channel", "Kênh bán hàng", CRUD),
                    new PageDef("supplier", "Nhà cung cấp", CRUD),
                    new PageDef("warehouse", "Kho", CRUD),
                    new PageDef("branch", "Chi nhánh", CRUD),
                    new PageDef("selling_zone", "Vùng bán hàng", CRUD),
                    new PageDef("route_master", "Khung tuyến", CRUD),
                    new PageDef("region", "Miền", CRUD),
                    new PageDef("province", "Tỉnh/Thành phố", CRUD),
                    new PageDef("district", "Quận/Huyện", CRUD),
                    new PageDef("ward", "Phường/Xã", CRUD),
                    new PageDef("uom", "Đơn vị tính", CRUD),
                    new PageDef("uom_group", "Nhóm quy đổi ĐVT", CRUD),
                    new PageDef("tax_group", "Nhóm thuế", CRUD),
                    new PageDef("price_list", "Bảng giá", CRUD),
                    new PageDef("employee", "Nhân viên", CRUD),
                    new PageDef("employee_position", "Chức vụ", CRUD),
                    new PageDef("salesman_type", "Loại NVBH", CRUD),
                    new PageDef("company", "Công ty", List.of("view", "edit")))),

            new GroupDef("SYSTEM", "Hệ thống", List.of(
                    new PageDef("system_user", "Người dùng", CRUD),
                    new PageDef("system_role", "Phân quyền", CRUD),
                    new PageDef("system_login_log", "Nhật ký đăng nhập", List.of("view")),
                    new PageDef("system_numbering_config", "Cấu hình đánh số chứng từ", VIEW_EDIT),
                    new PageDef("system_active_session", "Quản lý thiết bị đăng nhập", VIEW_EDIT),
                    new PageDef("system_approval_config", "Quy trình duyệt", CRUD),
                    new PageDef("system_email_config", "Cấu hình Email", VIEW_EDIT),
                    new PageDef("system_setting", "Cài đặt hệ thống", CRUD))));

    // Tat ca ma quyen hop le dang "page:action" - dung de validate lenh luu (khong cho luu ma la).
    public static List<String> allCodes() {
        return GROUPS.stream()
                .flatMap(g -> g.pages().stream())
                .flatMap(p -> p.actions().stream().map(a -> p.code() + ":" + a))
                .toList();
    }

    // Toan bo quyen (dung cho ADMIN - "Grant all permissions", khong can luu rieng trong DB).
    public static String allCodesJoined() {
        return String.join(",", allCodes());
    }

    // Mac dinh cho user MOI KHONG phai ADMIN (xem UserService.create()): toan bo quyen cua 6 nhom
    // nghiep vu, TRU nhom "He thong" (Users/Roles/cau hinh he thong) - giu dung tinh than "moi quyen
    // nhung khong co quyen admin" nguoi dung yeu cau, vi nhom He thong von la san rieng cua ADMIN tu
    // truoc gio (quan ly tai khoan/phan quyen nguoi khac). Nguoi quan tri van co the tu tay tich them
    // tung quyen He thong cho 1 nguoi cu the qua modal "Phan quyen" neu that su can.
    public static String nonAdminDefaultCodesJoined() {
        return String.join(",", GROUPS.stream()
                .filter(g -> !"SYSTEM".equals(g.code()))
                .flatMap(g -> g.pages().stream())
                .flatMap(p -> p.actions().stream().map(a -> p.code() + ":" + a))
                .toList());
    }

    private PermissionCatalog() {
    }
}
