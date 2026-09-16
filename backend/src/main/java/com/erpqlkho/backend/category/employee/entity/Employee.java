package com.erpqlkho.backend.category.employee.entity;

import com.erpqlkho.backend.category.employeeposition.entity.EmployeePosition;
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

// Employee Master Data tach rieng khoi User (thay cho thiet ke gop-vao-User cu o V16) - 1 bang
// chung cho ca 2 tab NVBH/NV, loc theo "type", tab NVBH chi cho chon position=SALESMAN, tab NV
// chi cho chon SS/ASM (validate o Frontend, xem tonghop.md Nhom 5). userId nullable = "tu dong gan
// user" - khong bat buoc 1 Employee phai co tai khoan dang nhap.
@Getter
@Setter
@Entity
@Table(name = "employee")
public class Employee extends BaseEntity {

    // NVBH / NV
    @Column(nullable = false, length = 10)
    private String type;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 500)
    private String address;

    @Column(name = "id_card_number", length = 50)
    private String idCardNumber;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "position_id")
    private EmployeePosition position;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "resign_date")
    private LocalDate resignDate;

    @Column(name = "is_delivery_man", nullable = false)
    private boolean deliveryMan = false;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;
}
