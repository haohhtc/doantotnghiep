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

// "Tra hang" (App Van-Sale, di dong) - chieu NGUOC lai VanSaleAdvance: NVBH tra hang con du cuoi
// ngay ve Kho Main. Duyet (DRAFT -> CLOSED) chuyen Van -> Main CHI NHANH that + tru "Kho NV"
// (EmployeeStock) cua dung nguoi tra (chan neu vuot so dang co, xem EmployeeStockService.decrease()).
@Getter
@Setter
@Entity
@Table(name = "van_sale_return")
public class VanSaleReturn extends BaseEntity {

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

    // DRAFT: dang nhap lieu | CLOSED: da duyet, da chuyen kho Van->Main va tru Kho NV
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "vanSaleReturn", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<VanSaleReturnItem> items = new ArrayList<>();
}
