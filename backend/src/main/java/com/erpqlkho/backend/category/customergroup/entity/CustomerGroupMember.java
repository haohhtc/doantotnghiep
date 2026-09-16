package com.erpqlkho.backend.category.customergroup.entity;

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

// Nhom khach hang chuyen tu FK don sang M:N - xem V21__employee_route_customer_group_mn.sql.
// Khong extends BaseEntity: chi gan/go, giong ItemBranch/ProductGroupItem.
@Getter
@Setter
@Entity
@Table(name = "customer_group_member")
public class CustomerGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_group_id", nullable = false)
    private CustomerGroup customerGroup;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
