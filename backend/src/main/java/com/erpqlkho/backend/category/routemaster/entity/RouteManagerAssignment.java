package com.erpqlkho.backend.category.routemaster.entity;

import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.common.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// Timeline Quan ly (manage_by) cua 1 khung tuyen - doc lap voi RouteSalesmanAssignment (2 timeline
// tach roi theo dung yeu cau) - THAY THE han RouteSetting cu, xem V21__employee_route_customer_group_mn.sql.
@Getter
@Setter
@Entity
@Table(name = "route_manager_assignment")
public class RouteManagerAssignment extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_master_id", nullable = false)
    private RouteMaster routeMaster;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
