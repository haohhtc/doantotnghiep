package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.entity.DeliveryOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    boolean existsByDocNumber(String docNumber);

    // App Van-Sale (di dong): xem chi tiet 1 don - chi can Don giao hang cua DUNG don do, khong
    // tai het toan bo bang (xem DeliveryOrderController, du lieu lon se rat nang cho mobile).
    java.util.List<DeliveryOrder> findBySalesOrderId(Long salesOrderId);

    // Chieu salesOrderId -> vanWarehouseId cua CAC don giao hang da CLOSED va da chuyen kho that
    // (vanWarehouse != null) - dung cho trang Ton kho tinh "Da dat hang" (xem InventoriesController)
    // khong can tai toan bo Don giao hang (chi can 2 cot nay).
    interface ClosedVanMapping {
        Long getSalesOrderId();
        Long getVanWarehouseId();
    }

    @org.springframework.data.jpa.repository.Query(
            "select d.salesOrder.id as salesOrderId, d.vanWarehouse.id as vanWarehouseId "
                    + "from DeliveryOrder d where d.status = 'CLOSED' and d.vanWarehouse is not null")
    List<ClosedVanMapping> findClosedVanMapping();

    // Dung cho luoi "Don giao hang" (phan trang server-side) - loc theo chi nhanh (qua kho xuat)
    // + tim theo so don giao/so don ban, moi nhat truoc. Xem DeliveryOrderController.search().
    @org.springframework.data.jpa.repository.Query("""
            select d from DeliveryOrder d
            where (:branchId is null or d.warehouse.branch.id = :branchId)
              and (:search is null or :search = ''
                   or lower(d.docNumber) like lower(concat('%', :search, '%'))
                   or lower(d.salesOrder.docNumber) like lower(concat('%', :search, '%')))
            order by d.id desc
            """)
    Page<DeliveryOrder> search(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                                @org.springframework.data.repository.query.Param("search") String search,
                                Pageable pageable);

    // V49: 1 Don hang ban co the co nhieu Don giao hang (giao nhieu dot) nen tra ve List, khong con
    // la "1 don giao duy nhat cua don hang" nhu truoc (xem DeliveryOrderService.create() tinh "con
    // lai bao nhieu chua giao", InvoiceService tim dot giao can xuat hoa don).
    List<DeliveryOrder> findBySalesOrderIdAndStatusNot(Long salesOrderId, String status);

    // Dung de phan biet hoa don Van Sale (V51, khong bao gio co Don giao hang) voi hoa don cu
    // truoc V49 (deliveryOrder null nhung van co 1 Don giao hang that su, xem resolveDeliveryOrder())
    // - xem InvoiceService.cancel().
    boolean existsBySalesOrderId(Long salesOrderId);
}
