package com.erpqlkho.backend.category.routemaster.entity;

import com.erpqlkho.backend.category.customer.entity.Customer;
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

import java.time.LocalDateTime;

// Khong extends BaseEntity: bang join thuan tuy (tab "List Of Outlet"), chi can created_at
// de biet ngay gan - khong co updated_at (khong the "sua", chi gan/go).
@Getter
@Setter
@Entity
@Table(name = "route_master_outlet")
public class RouteMasterOutlet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JsonIgnore: tranh vong lap vo han RouteMaster -> outlets -> RouteMasterOutlet -> routeMaster...
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_master_id", nullable = false)
    private RouteMaster routeMaster;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thu tu ghe tham + lich ghe tham (thu trong tuan + tuan cu the trong nam) - xem
    // V21__employee_route_customer_group_mn.sql, dung cho Nhom 6 "Loai ghe tham" cua Sales Order.
    @Column(name = "visit_order")
    private Integer visitOrder;

    private boolean monday;
    private boolean tuesday;
    private boolean wednesday;
    private boolean thursday;
    private boolean friday;
    private boolean saturday;
    private boolean sunday;

    // Danh sach tuan cu the trong nam (ISO week 1-53), cach nhau dau phay (VD "3,7,11,15") - xem
    // V40__route_outlet_visit_weeks.sql. Tu reset moi nam moi vi chi luu so thu tu tuan, khong
    // luu nam - tuan 3 cua nam nao cung tinh la "tuan 3".
    @Column(name = "visit_weeks", length = 255)
    private String visitWeeks;
}
