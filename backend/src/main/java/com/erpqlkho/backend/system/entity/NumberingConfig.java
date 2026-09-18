package com.erpqlkho.backend.system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Noi duy nhat sinh so phieu cho moi loai chung tu (giong vai tro StockService voi ton kho) - xem
// NumberingConfigService, V29__numbering_config.sql.
@Getter
@Setter
@Entity
@Table(name = "numbering_config")
public class NumberingConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doc_type", nullable = false, unique = true, length = 50)
    private String docType;

    @Column(nullable = false, length = 10)
    private String prefix;

    @Column(name = "current_sequence", nullable = false)
    private int currentSequence = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
