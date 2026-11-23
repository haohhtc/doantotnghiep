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
              and (:status is null or :status = '' or d.status = :status)
              and (:search is null or :search = ''
                   or lower(d.docNumber) like lower(concat('%', :search, '%'))
                   or lower(d.salesOrder.docNumber) like lower(concat('%', :search, '%')))
            order by d.id desc
            """)
    Page<DeliveryOrder> search(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                                @org.springframework.data.repository.query.Param("status") String status,
                                @org.springframework.data.repository.query.Param("search") String search,
                                Pageable pageable);

    // Dung cho man hinh "Phieu in nhanh" (Sales Order / Picking List / Delivery Note Printing) -
    // loc server-side theo khoang Ngay giao (docDate) + Loai don + Trang thai in, TRANH tai toan bo
    // bang (vai nghin don, moi don long nhieu quan he EAGER) nhu /delivery-orders (khong phan
    // trang/loc) vi qua nang cho man hinh nay.
    //
    // printStatus: ALL = loc theo docDate (ngay giao) nhu binh thuong, bat ke da in hay chua.
    // NOT_PRINTED = loc theo docDate NHU TREN, VA docNumber chua tung xuat hien trong printed_note
    // (doc_type=DELIVERY_NOTE). PRINTED = BO QUA docDate, thay vao do chi lay don co docNumber nam
    // trong printed_note VA ngay TAI (printedAt) nam trong khoang fromDateTime/toDateTime - vi khi
    // xem "Da in" nguoi dung quan tam ngay in, khong phai ngay giao (xem PrintedNote/index.jsx).
    @org.springframework.data.jpa.repository.Query("""
            select d from DeliveryOrder d
            where d.status <> 'CANCELLED'
              and (:branchId is null or d.warehouse.branch.id = :branchId)
              and (:orderType is null or d.salesOrder.orderType = :orderType)
              and (
                    (:printStatus = 'ALL'
                        and (:fromDate is null or d.docDate >= :fromDate)
                        and (:toDate is null or d.docDate <= :toDate))
                 or (:printStatus = 'NOT_PRINTED'
                        and (:fromDate is null or d.docDate >= :fromDate)
                        and (:toDate is null or d.docDate <= :toDate)
                        and d.docNumber not in (
                            select p.docNumber from com.erpqlkho.backend.printing.entity.PrintedNote p
                            where p.docType = 'DELIVERY_NOTE'
                        ))
                 or (:printStatus = 'PRINTED'
                        and d.docNumber in (
                            select p.docNumber from com.erpqlkho.backend.printing.entity.PrintedNote p
                            where p.docType = 'DELIVERY_NOTE'
                              and (:fromDateTime is null or p.printedAt >= :fromDateTime)
                              and (:toDateTime is null or p.printedAt <= :toDateTime)
                        ))
                  )
            order by d.docDate desc, d.id desc
            """)
    Page<DeliveryOrder> searchForPrint(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                                        @org.springframework.data.repository.query.Param("fromDate") java.time.LocalDate fromDate,
                                        @org.springframework.data.repository.query.Param("toDate") java.time.LocalDate toDate,
                                        @org.springframework.data.repository.query.Param("fromDateTime") java.time.LocalDateTime fromDateTime,
                                        @org.springframework.data.repository.query.Param("toDateTime") java.time.LocalDateTime toDateTime,
                                        @org.springframework.data.repository.query.Param("orderType") String orderType,
                                        @org.springframework.data.repository.query.Param("printStatus") String printStatus,
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
