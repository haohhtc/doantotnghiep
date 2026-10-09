package com.erpqlkho.backend.category.customer.dto;

import lombok.Getter;
import lombok.Setter;

// Thong tin tuyen cua 1 khach hang, suy ra tu route_master_outlet (1 khach hang chi thuoc 1
// tuyen) - dung cho Sales Order validate Chi nhanh + tinh "Loai ghe tham" (Nhom 6, tonghop.md).
// Neu khach hang chua duoc gan vao tuyen nao, tat ca field deu null/false.
@Getter
@Setter
public class CustomerRouteInfoDto {

    private Long branchId;
    private String branchName;

    private Long routeMasterId;
    private String routeMasterName;

    // NVBH dang phu trach tuyen TAI NGAY duoc truyen vao findRouteInfo(customerId, date) - co the
    // null neu tuyen dang trong NVBH tai thoi diem do.
    private Long salesmanId;
    private String salesmanName;

    private boolean monday;
    private boolean tuesday;
    private boolean wednesday;
    private boolean thursday;
    private boolean friday;
    private boolean saturday;
    private boolean sunday;

    // Danh sach tuan cu the trong nam (1-53) khach hang duoc ghe tham, cach nhau dau phay - xem
    // V40__route_outlet_visit_weeks.sql.
    private String visitWeeks;
}
