package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.EmployeeStockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface EmployeeStockTransactionRepository extends JpaRepository<EmployeeStockTransaction, Long> {

    // Cong don Da nhan/Da xuat theo tung san pham trong 1 khoang thoi gian (vd "hom nay") - dung
    // cho EmployeeStockService.dailySummary().
    @Query("""
            select t.product.id as productId, t.type as type, coalesce(sum(t.quantity), 0) as total
            from EmployeeStockTransaction t
            where t.employee.id = :employeeId and t.createdAt >= :from and t.createdAt < :to
            group by t.product.id, t.type
            """)
    List<ProductTypeTotal> sumByEmployeeAndTypeBetween(@Param("employeeId") Long employeeId,
                                                        @Param("from") LocalDateTime from,
                                                        @Param("to") LocalDateTime to);

    interface ProductTypeTotal {
        Long getProductId();
        String getType();
        BigDecimal getTotal();
    }
}
