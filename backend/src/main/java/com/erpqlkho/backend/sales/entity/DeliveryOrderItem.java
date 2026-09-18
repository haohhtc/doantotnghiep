package com.erpqlkho.backend.sales.entity;

import com.erpqlkho.backend.category.product.entity.Product;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

// So luong o day la SO LUONG GIAO THUC TE - mac dinh copy tu SalesOrderDetail luc tao DO, nhung
// cho sua truoc khi Xac nhan (VD giao thieu do het hang/hu hong - dung de tra loi tinh huong Nhi
// neu ra: khong bat buoc phai giao du 100% nhu don da dat).
@Getter
@Setter
@Entity
@Table(name = "delivery_order_item")
public class DeliveryOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_order_id", nullable = false)
    private DeliveryOrder deliveryOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(length = 255)
    private String note;
}
