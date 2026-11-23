package com.erpqlkho.backend.inventory.repository;

import com.erpqlkho.backend.inventory.entity.GoodsIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface GoodsIssueRepository extends JpaRepository<GoodsIssue, Long> {
    boolean existsByDocNumber(String docNumber);

    // Dung cho man hinh "Phieu in nhanh" (/sales/printed-note, Doc Type = Phieu xuat kho tong hop) -
    // loc server-side theo khoang Ngay chung tu (docDate) + Ly do xuat + Trang thai in, tranh tai
    // toan bo bang nhu GET /goods-issues (khong phan trang/loc, cung long EAGER nang nhu
    // DeliveryOrder tung gap). Y nghia printStatus: xem DeliveryOrderRepository.searchForPrint.
    @Query("""
            select g from GoodsIssue g
            where (:branchId is null or g.warehouse.branch.id = :branchId)
              and (:reason is null or g.reason = :reason)
              and (
                    (:printStatus = 'ALL'
                        and (:fromDate is null or g.docDate >= :fromDate)
                        and (:toDate is null or g.docDate <= :toDate))
                 or (:printStatus = 'NOT_PRINTED'
                        and (:fromDate is null or g.docDate >= :fromDate)
                        and (:toDate is null or g.docDate <= :toDate)
                        and g.docNumber not in (
                            select p.docNumber from com.erpqlkho.backend.printing.entity.PrintedNote p
                            where p.docType = 'STOCK_ISSUE'
                        ))
                 or (:printStatus = 'PRINTED'
                        and g.docNumber in (
                            select p.docNumber from com.erpqlkho.backend.printing.entity.PrintedNote p
                            where p.docType = 'STOCK_ISSUE'
                              and (:fromDateTime is null or p.printedAt >= :fromDateTime)
                              and (:toDateTime is null or p.printedAt <= :toDateTime)
                        ))
                  )
            order by g.docDate desc, g.id desc
            """)
    Page<GoodsIssue> searchForPrint(@Param("branchId") Long branchId,
                                     @Param("fromDate") LocalDate fromDate,
                                     @Param("toDate") LocalDate toDate,
                                     @Param("fromDateTime") LocalDateTime fromDateTime,
                                     @Param("toDateTime") LocalDateTime toDateTime,
                                     @Param("reason") String reason,
                                     @Param("printStatus") String printStatus,
                                     Pageable pageable);
}
