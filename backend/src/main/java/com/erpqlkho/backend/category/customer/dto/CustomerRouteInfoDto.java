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

    private boolean monday;
    private boolean tuesday;
    private boolean wednesday;
    private boolean thursday;
    private boolean friday;
    private boolean saturday;
    private boolean sunday;

    private boolean week1;
    private boolean week2;
    private boolean week3;
    private boolean week4;
}
