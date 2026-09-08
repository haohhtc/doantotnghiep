package com.erpqlkho.backend.category.product.entity;

import com.erpqlkho.backend.category.branch.entity.Branch;
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

// Item-Branch Assignment: 1 san pham duoc phan bo/ap dung o 1 chi nhanh nao.
// Khong extends BaseEntity: bang join thuan tuy, chi gan/go (giong RouteMasterOutlet).
@Getter
@Setter
@Entity
@Table(name = "item_branch")
public class ItemBranch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
