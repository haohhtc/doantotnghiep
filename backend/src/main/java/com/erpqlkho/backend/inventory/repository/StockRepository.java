package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    // PESSIMISTIC_WRITE (SELECT ... FOR UPDATE) - dung khi doc de SUA tru/cong ton kho
    // (StockService.increase/decrease/adjust) de tranh "lost update" khi 2 giao dich cung luc doc
    // trung 1 dong stock (vd 2 nguoi cung xac nhan xuat kho khi chi con 1 don vi) - giao dich sau
    // phai doi giao dich truoc commit xong moi duoc doc, luc do thay dung so lieu moi nhat.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Stock> findWithLockByProductIdAndWarehouseId(Long productId, Long warehouseId);
}
