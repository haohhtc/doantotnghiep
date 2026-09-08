package com.erpqlkho.backend.category.routemaster.entity;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import com.erpqlkho.backend.common.base.BaseEntity;
import com.erpqlkho.backend.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "route_master")
public class RouteMaster extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    // type/channel/sellingCategory: giu dang free-text nhu he thong that (khong tach bang rieng).
    @Column(length = 50)
    private String type;

    @Column(length = 50)
    private String channel;

    @Column(name = "selling_category", length = 50)
    private String sellingCategory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "selling_zone_id", nullable = false)
    private SellingZone sellingZone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // Gia tri mac dinh cua tuyen (nullable) - RouteSetting moi la noi giao that su cho 1 sales person.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manage_by_id")
    private User manageBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "salesman_id")
    private User salesman;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
