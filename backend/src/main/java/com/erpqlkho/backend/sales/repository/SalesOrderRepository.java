package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    // "Da dat hang" (theo don vi co so) cua 1 san pham tai 1 kho: don PENDING/CONFIRMED con giu cho - voi kho
    // Main den khi Don giao hang duoc Xac nhan (hang da sang Kho Van), voi kho Van den khi xuat Hoa don.
    // 3 truong hop cong don (V39 - sua loi "quen cam coc" o Kho Van sau khi giao):
    //   1) Don con nam o kho nguon (Main) - chua co DO CLOSED.
    //   2) Don dat thang tu kho Van (van sale truc tiep) - chua xuat hoa don.
    //   3) Don nguon la Main nhung DA co DO CLOSED chuyen sang dung kho Van nay - hang da nam o Van
    //      cho xuat hoa don, phai tinh la "da dat hang" tai Van de khong bi ban trung cho don khac.
    // excludeOrderId: bo qua chinh don dang sua/duyet (truyen -1 neu khong co) de khong tu cong don voi
    // chinh no. Cung cong thuc voi cot "Da dat hang" o trang Ton kho (frontend Inventories/index.jsx).
    // Chi loai don co hoa don CON HIEU LUC (status <> CANCELLED) - don co hoa don da Huy (xem
    // InvoiceService.cancel(), V45) van phai tinh la dang giu cho cho den khi xuat hoa don MOI.
    @org.springframework.data.jpa.repository.Query("""
            select coalesce(sum(d.baseQuantity), 0) from SalesOrderDetail d
            where d.product.id = :productId
              and d.salesOrder.status in ('PENDING', 'CONFIRMED')
              and d.salesOrder.id <> :excludeOrderId
              and not exists (select 1 from Invoice i where i.salesOrder = d.salesOrder and i.status <> 'CANCELLED')
              and (
                (d.salesOrder.warehouse.id = :warehouseId
                  and d.salesOrder.warehouse.warehouseType <> 'VAN'
                  and not exists (select 1 from DeliveryOrder o where o.salesOrder = d.salesOrder and o.status = 'CLOSED'))
                or (d.salesOrder.warehouse.id = :warehouseId
                  and d.salesOrder.warehouse.warehouseType = 'VAN')
                or exists (select 1 from DeliveryOrder o2 where o2.salesOrder = d.salesOrder and o2.status = 'CLOSED'
                  and o2.vanWarehouse.id = :warehouseId)
              )
            """)
    java.math.BigDecimal sumCommittedBase(@org.springframework.data.repository.query.Param("productId") Long productId,
                                          @org.springframework.data.repository.query.Param("warehouseId") Long warehouseId,
                                          @org.springframework.data.repository.query.Param("excludeOrderId") Long excludeOrderId);

    boolean existsByDocNumber(String docNumber);
}
