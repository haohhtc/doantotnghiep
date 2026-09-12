package com.erpqlkho.backend.category.pricelist.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// type (STANDARD/CHANNEL/CONTRACT) chi mang tinh mo ta/nhan cho nguoi quan tri, khong tu doi
// logic tra gia - xem PriceListService.lookupPrice.
@Getter
@Setter
@Entity
@Table(name = "price_list")
public class PriceList extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    private String type = "STANDARD";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
