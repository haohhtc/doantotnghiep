package com.erpqlkho.backend.inventory.entity;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// "Kho NV" (App Van-Sale, di dong) - SO PHU ghi "phan cua ai" BEN TRONG Kho Van cua chi nhanh,
// KHONG phai 1 kho song song. Cong employee_stock cua moi NVBH cung chi nhanh = dung bang
// Stock cua Kho Van chi nhanh do (bang stock hien co KHONG doi gi). Moi Ung hang/Tra hang/Don
// Van Sale deu phai cap nhat CA bang stock (Kho Van chi nhanh, qua StockService) LAN bang nay
// (EmployeeStockService) trong CUNG 1 giao dich de giu dung bat bien tren.
@Getter
@Setter
@Entity
@Table(name = "employee_stock")
public class EmployeeStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
