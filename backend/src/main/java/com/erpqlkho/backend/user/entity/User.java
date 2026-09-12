package com.erpqlkho.backend.user.entity;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
import com.erpqlkho.backend.category.salesmantype.entity.SalesmanType;
import com.erpqlkho.backend.common.base.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    // @JsonIgnore: khong bao gio tra hash mat khau ve client, du la User dung truc tiep
    // (GET /api/users) hay long ben trong entity khac (Warehouse.manager...).
    @JsonIgnore
    @Column(nullable = false)
    private String password; // BCrypt hash

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(length = 150)
    private String email;

    // EAGER: Role duoc doc trong CustomUserDetailsService/JwtAuthFilter (khong co @Transactional),
    // LAZY se nem LazyInitializationException vi session da dong (chan MOI request co xac thuc).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    // Chuc vu / Loai nhan vien ban hang / Chi nhanh lam viec (nullable) - Employee Master Data
    // don gian hoa, dung chung bang User thay vi tach bang rieng - xem
    // V16__employee_position_salesman_type.sql va tonghop.md muc "Nhan vien".
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "position_id")
    private EmployeePosition position;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "salesman_type_id")
    private SalesmanType salesmanType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    public enum UserStatus {
        ACTIVE, LOCKED
    }
}
