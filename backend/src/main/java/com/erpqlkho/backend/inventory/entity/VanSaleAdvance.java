package com.erpqlkho.backend.inventory.entity;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.common.base.BaseEntity;
import com.erpqlkho.backend.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// "Ung hang" (App Van-Sale, di dong) - NVBH nhan hang tu Kho Main nap len "xe" truoc khi di tuyen.
// Duyet (DRAFT -> CLOSED) chuyen Main -> Van CHI NHANH that (giong Dieu chuyen kho, qua
// StockService) VA cong them "Kho NV" (EmployeeStock) cua dung nguoi ung - ca 2 trong CUNG 1 giao
// dich. Kho Main/Van suy tu chi nhanh cua tai khoan NVBH dang dang nhap (employee.user.branch),
// khong chon tay.
@Getter
@Setter
@Entity
@Table(name = "van_sale_advance")
public class VanSaleAdvance extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(length = 255)
    private String reason;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang nhap lieu | CLOSED: da duyet, da chuyen kho Main->Van va cong Kho NV
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "vanSaleAdvance", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<VanSaleAdvanceItem> items = new ArrayList<>();
}
