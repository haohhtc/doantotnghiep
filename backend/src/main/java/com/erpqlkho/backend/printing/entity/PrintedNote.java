package com.erpqlkho.backend.printing.entity;

import com.erpqlkho.backend.user.entity.User;
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

// 1 dong = 1 lan "tai phieu in xuong" that su (xem V56) - man hinh Phieu in nhanh dung bang nay de
// biet 1 chung tu (doc_type + doc_number) da duoc tai bao nhieu lan + lan gan nhat, khong dung cot
// rieng tren DeliveryOrder/GoodsIssue nua vi phai dung chung cho ca 2 loai chung tu.
@Getter
@Setter
@Entity
@Table(name = "printed_note")
public class PrintedNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // DELIVERY_NOTE (Phieu giao hang) | STOCK_ISSUE (Phieu xuat kho tong hop).
    @Column(name = "doc_type", nullable = false, length = 20)
    private String docType;

    @Column(name = "doc_number", nullable = false, length = 50)
    private String docNumber;

    @Column(name = "printed_at", nullable = false)
    private LocalDateTime printedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "printed_by", nullable = false)
    private User printedBy;
}
