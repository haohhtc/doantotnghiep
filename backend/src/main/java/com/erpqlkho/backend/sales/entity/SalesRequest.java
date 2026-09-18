package com.erpqlkho.backend.sales.entity;

import com.erpqlkho.backend.category.customer.entity.Customer;
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

// Yeu cau ban hang (SR) - buoc ghi tam truoc Don hang ban (SO), dung theo dung chuoi DMS goc
// SR -> SO -> DO -> Xac nhan DO. Chua co kho xuat (chua chot luc ghi tam), chua anh huong ton
// kho. Chuyen thanh SO qua SalesRequestService.convert() (DRAFT -> CONVERTED, tao 1 SalesOrder
// moi trang thai PENDING) - xem V34.
@Getter
@Setter
@Entity
@Table(name = "sales_request")
public class SalesRequest extends BaseEntity {

    @Column(name = "doc_number", nullable = false, unique = true, length = 50)
    private String docNumber;

    @Column(name = "doc_date", nullable = false)
    private LocalDate docDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(length = 500)
    private String remarks;

    // DRAFT: dang ghi tam, cho chuyen thanh don | CONVERTED: da chuyen thanh Don hang ban
    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy = "salesRequest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<SalesRequestItem> items = new ArrayList<>();
}
