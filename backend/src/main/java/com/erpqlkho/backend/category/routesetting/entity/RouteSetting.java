package com.erpqlkho.backend.category.routesetting.entity;

import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
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

// "Giao tuyen van hanh" - 1 route_master co the duoc nhieu route_setting tham chieu toi
// (doi sales person theo tung giai doan ma khong can tao lai khung tuyen).
@Getter
@Setter
@Entity
@Table(name = "route_setting")
public class RouteSetting extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_master_id", nullable = false)
    private RouteMaster routeMaster;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_person_id", nullable = false)
    private User salesPerson;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manage_by_id")
    private User manageBy;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
