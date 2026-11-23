package com.erpqlkho.backend.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// Danh sach RUT GON hoa don (chi 4 truong can cho combobox "Hoa don goc" o man Tra hang - xem
// frontend/src/pages/sales/SalesReturn/index.jsx) - tranh tai toan bo Invoice (kem het SalesOrder +
// InvoiceItem + Product long nhau, ~145MB/4900 hoa don, lam trang Tra hang vao cham ro ret).
@Getter
@AllArgsConstructor
public class InvoiceOptionDto {
    private Long id;
    private String invoiceNumber;
    private String customerName;
    private Long branchId;
}
