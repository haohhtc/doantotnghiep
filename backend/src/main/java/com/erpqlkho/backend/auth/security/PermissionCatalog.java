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

    // Thu tu hien thi trong modal "Phan quyen" da chot theo yeu cau nguoi dung: Danh muc -> Ban
    // hang -> Kho -> Mua hang -> He thong.
    public static final List<GroupDef> GROUPS = List.of(
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

            // Giao hang/Hoa don/Tra hang khach gop chung vao day thay vi tach nhom rieng - khop dung
            // voi Sidebar (xem AppLayout.jsx: ca 5 trang nay nam chung 1 menu "Bán hàng (Sales
            // Order)"), tranh nguoi dung Phan quyen thay cay quyen tach khac voi cay menu thuc te.
            new GroupDef("SALES", "Bán hàng", List.of(
                    new PageDef("sales_order", "Đơn hàng bán", List.of("view", "create", "edit", "confirm", "cancel", "delete")),
                    new PageDef("sales_request", "Yêu cầu bán hàng", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("delivery_order", "Đơn giao hàng", List.of("view", "create", "edit", "confirm", "cancel", "delete")),
                    new PageDef("invoice", "Hóa đơn", List.of("view", "create", "cancel")),
                    new PageDef("sales_return", "Trả hàng khách", List.of("view", "create", "edit", "confirm", "cancel", "delete")))),

            new GroupDef("INVENTORY", "Kho", List.of(
                    new PageDef("goods_receipt", "Phiếu nhập hàng", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("goods_issue", "Phiếu xuất kho", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("inventory_transfer", "Chuyển kho", List.of("view", "create", "edit", "confirm_send", "confirm_receive", "delete")),
                    new PageDef("stock_take", "Kiểm kê kho", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("stock_receipt", "Phiếu nhập kho khác", List.of("view", "create", "edit", "confirm", "delete")),
                    new PageDef("van_sale_advance", "Ứng hàng", List.of("view", "confirm")),
                    new PageDef("stock", "Tồn kho", List.of("view")))),

            // "Tra hang NCC" o day THUC RA thuoc menu "Mua hàng (Purchase Order)" rieng cua Sidebar
            // (khac han menu "Bán hàng"), dat lai ten nhom cho dung - xem AppLayout.jsx.
            new GroupDef("PURCHASE", "Mua hàng", List.of(
                    new PageDef("purchase_request", "Yêu cầu mua hàng", List.of("view", "create", "edit", "confirm", "convert", "delete")),
                    new PageDef("purchase_return", "Trả hàng NCC", List.of("view", "create", "edit", "confirm", "delete")))),

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

    private static PageDef findPage(String pageCode) {
        return GROUPS.stream()
                .flatMap(g -> g.pages().stream())
                .filter(p -> p.code().equals(pageCode))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay trang trong catalog: " + pageCode));
    }

    // Toan bo hanh dong (vd "sales_order:view", "sales_order:edit"...) cua DUNG 1 trang.
    private static List<String> fullActionsOf(String pageCode) {
        PageDef page = findPage(pageCode);
        return page.actions().stream().map(a -> pageCode + ":" + a).toList();
    }

    // Chi hanh dong "view" cua TAT CA trang trong 1 nhom (vd xem Danh muc nhung khong Tao/Sua/Xoa).
    private static List<String> viewOnlyOfGroup(String groupCode) {
        return GROUPS.stream()
                .filter(g -> g.code().equals(groupCode))
                .flatMap(g -> g.pages().stream())
                .filter(p -> p.actions().contains("view"))
                .map(p -> p.code() + ":view")
                .toList();
    }

    // Toan bo hanh dong cua TAT CA trang trong 1 nhom.
    private static List<String> fullActionsOfGroup(String groupCode) {
        return GROUPS.stream()
                .filter(g -> g.code().equals(groupCode))
                .flatMap(g -> g.pages().stream())
                .flatMap(p -> p.actions().stream().map(a -> p.code() + ":" + a))
                .toList();
    }

    // Mac dinh cho user MOI theo DUNG Role duoc chon luc tao (xem UserService.create()) - khop
    // dung pham vi cong viec thuc te cua tung vai tro, KHONG con cap chung 1 bo "du 4 nhom nghiep
    // vu" cho moi role nhu truoc nua:
    //   - SALES_STAFF: toan quyen Ban hang (gom ca Giao hang/Hoa don/Tra hang khach, deu nam chung
    //     1 nhom "Bán hàng" trong catalog) + CHI XEM Danh muc - khong dung gi den Kho/Mua hang, TRU
    //     rieng "Ton kho" (chi view) vi App Van-Sale (NVBH dung Role nay) can xem so luong ton de
    //     doi chieu luc tao Don hang/Ung hang/Tra hang - khong phai quan ly trang Ton kho tren Web.
    //   - WAREHOUSE_MANAGER: toan quyen Kho + rieng Giao hang (delivery_order, vi day la buoc xuat
    //     kho that su) + CHI XEM Danh muc - khong dung gi den Ban hang/Hoa don/Mua hang.
    //   - Role khac (tuong lai) / ADMIN: tra ve rong - ADMIN khong doc cot nay (luon tu dong du),
    //     role la chua biet thi de Admin tu tay cap qua modal "Phan quyen", tranh doan sai pham vi.
    // Nguoi quan tri van co the tu tay tich/bo them tung quyen rieng cho 1 nguoi cu the qua modal
    // "Phan quyen" o trang Nguoi dung neu can ngoai pham vi mac dinh nay.
    public static String defaultCodesForRole(String roleCode) {
        List<String> codes = new java.util.ArrayList<>();
        if ("SALES_STAFF".equals(roleCode)) {
            codes.addAll(fullActionsOfGroup("SALES"));
            codes.addAll(viewOnlyOfGroup("CATALOG"));
            codes.addAll(fullActionsOf("stock"));
        } else if ("WAREHOUSE_MANAGER".equals(roleCode)) {
            codes.addAll(fullActionsOfGroup("INVENTORY"));
            codes.addAll(fullActionsOf("delivery_order"));
            codes.addAll(viewOnlyOfGroup("CATALOG"));
        }
        return String.join(",", codes);
    }

    private PermissionCatalog() {
    }
}
