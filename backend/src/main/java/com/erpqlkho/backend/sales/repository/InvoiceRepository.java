package com.erpqlkho.backend.sales.repository;

import com.erpqlkho.backend.sales.dto.InvoiceOptionDto;
import com.erpqlkho.backend.sales.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    boolean existsByInvoiceNumber(String invoiceNumber);

    // Dung cho combobox "Hoa don goc" o man Tra hang cua khach (SalesReturn) - chi 4 truong rut
    // gon, KHONG tai ca Invoice (xem InvoiceOptionDto vi sao can cai nay).
    @org.springframework.data.jpa.repository.Query("""
            select new com.erpqlkho.backend.sales.dto.InvoiceOptionDto(
                i.id, i.invoiceNumber, i.salesOrder.customer.name, i.salesOrder.warehouse.branch.id)
            from Invoice i
            """)
    List<InvoiceOptionDto> findAllOptions();

    // Danh sach rieng sales_order_id dang co Hoa don CON HIEU LUC (khac CANCELLED) - dung cho
    // trang Ton kho tinh "Da dat hang" (xem InventoriesController) khong can tai toan bo Hoa don
    // (chi can biet DON NAO da xuat hoa don, khong can chi tiet dong hang).
    @org.springframework.data.jpa.repository.Query(
            "select distinct i.salesOrder.id from Invoice i where i.status <> 'CANCELLED'")
    List<Long> findActiveSalesOrderIds();

    // Dung cho luoi "Hoa don" (phan trang server-side) - loc theo chi nhanh (qua Don hang ban ->
    // kho xuat) + tim theo so hoa don/so don hang, moi nhat truoc. Xem InvoiceController.search().
    // displayStatus: khop dung 3 trang thai hien thi tren luoi (xem invoiceStatusTag() o frontend
    // Invoice/index.jsx) - KHAC voi cot i.status that trong DB (chi co ACTIVE/CANCELLED) vi "Tra
    // hang" la trang thai suy ra tu co ton tai Phieu tra hang DANG hieu luc (CLOSED) gan voi hoa don
    // nay hay khong, khong phai 1 cot rieng. null/rong = khong loc theo trang thai.
    @org.springframework.data.jpa.repository.Query("""
            select i from Invoice i
            where (:branchId is null or i.salesOrder.warehouse.branch.id = :branchId)
              and (:displayStatus is null or :displayStatus = ''
                   or (:displayStatus = 'CANCELLED' and i.status = 'CANCELLED')
                   or (:displayStatus = 'RETURNED' and i.status <> 'CANCELLED'
                       and exists (select 1 from SalesReturn r where r.invoice = i and r.status = 'CLOSED'))
                   or (:displayStatus = 'ACTIVE' and i.status <> 'CANCELLED'
                       and not exists (select 1 from SalesReturn r where r.invoice = i and r.status = 'CLOSED')))
              and (:search is null or :search = ''
                   or lower(i.invoiceNumber) like lower(concat('%', :search, '%'))
                   or lower(i.salesOrder.docNumber) like lower(concat('%', :search, '%')))
            order by i.id desc
            """)
    Page<Invoice> search(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                          @org.springframework.data.repository.query.Param("displayStatus") String displayStatus,
                          @org.springframework.data.repository.query.Param("search") String search,
                          Pageable pageable);

    // V49: 1 Don giao hang co the co nhieu hoa don (xuat tung phan) nen tra ve List, khong con la
    // "1 hoa don duy nhat cua don hang" nhu truoc (xem InvoiceService.create()/cancel(),
    // DeliveryOrderService.cancel()).
    List<Invoice> findByDeliveryOrderIdAndStatusNot(Long deliveryOrderId, String status);

    List<Invoice> findBySalesOrderIdAndStatusNot(Long salesOrderId, String status);

    // Dung cho luoi "Don giao hang" (phan trang) tinh "con lai chua xuat hoa don" cho tung dong -
    // chi can hoa don cua CAC don giao dang hien tren trang, khong can toan bo (xem
    // InvoiceController.findAll(deliveryOrderIds), frontend DeliveryOrder/index.jsx).
    List<Invoice> findByDeliveryOrderIdIn(List<Long> deliveryOrderIds);

    // App Van-Sale (di dong): xem chi tiet 1 don - chi can hoa don cua DUNG don do, khong tai het
    // toan bo bang (xem InvoiceController, du lieu lon se rat nang cho mobile).
    List<Invoice> findBySalesOrderId(Long salesOrderId);
}
