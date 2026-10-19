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

// So nhat ky bat bien cho Kho NV (giong StockTransaction cho bang stock) - xem V52. Dung de tinh
// "Dau ngay / Da nhan / Da xuat" theo ngay o man hinh Tong quan cua app (EmployeeStockService).
@Getter
@Setter
@Entity
@Table(name = "employee_stock_transaction")
public class EmployeeStockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // IN: ung hang nhan vao | OUT: ban Van Sale hoac tra hang ra
    @Column(nullable = false, length = 10)
    private String type;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    // VAN_SALE_ADVANCE / VAN_SALE_RETURN / VAN_SALE_INVOICE
    @Column(name = "reference_type", nullable = false, length = 30)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
