package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    // "Da dat hang" (theo don vi co so) cua 1 san pham tai 1 kho: don PENDING/CONFIRMED ma Don giao hang
    // chua Xac nhan (CLOSED). excludeOrderId: bo qua chinh don dang sua/duyet (truyen -1 neu khong co) de
    // khong tu cong don voi chinh no. Cung cong thuc voi cot "Da dat hang" o trang Ton kho.
    @org.springframework.data.jpa.repository.Query("""
            select coalesce(sum(d.baseQuantity), 0) from SalesOrderDetail d
            where d.product.id = :productId
              and d.salesOrder.warehouse.id = :warehouseId
              and d.salesOrder.status in ('PENDING', 'CONFIRMED')
              and d.salesOrder.id <> :excludeOrderId
              and not exists (select 1 from DeliveryOrder o where o.salesOrder = d.salesOrder and o.status = 'CLOSED')
            """)
    java.math.BigDecimal sumCommittedBase(@org.springframework.data.repository.query.Param("productId") Long productId,
                                          @org.springframework.data.repository.query.Param("warehouseId") Long warehouseId,
                                          @org.springframework.data.repository.query.Param("excludeOrderId") Long excludeOrderId);

    boolean existsByDocNumber(String docNumber);
}
