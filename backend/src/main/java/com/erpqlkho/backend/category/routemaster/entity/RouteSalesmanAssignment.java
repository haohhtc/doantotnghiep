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

// Timeline NVBH cua 1 khung tuyen - THAY THE han RouteSetting cu (theo quyet dinh nguoi dung, xem
// V21__employee_route_customer_group_mn.sql). Validate khong chong lap o RouteMasterService.
@Getter
@Setter
@Entity
@Table(name = "route_salesman_assignment")
public class RouteSalesmanAssignment extends BaseEntity {

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
