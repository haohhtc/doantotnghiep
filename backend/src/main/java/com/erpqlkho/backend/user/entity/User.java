package com.erpqlkho.backend.user.entity;

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

    public enum UserStatus {
        ACTIVE, LOCKED
    }
}
