package com.erpqlkho.backend.printing.repository;

import com.erpqlkho.backend.printing.entity.PrintedNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrintedNoteRepository extends JpaRepository<PrintedNote, Long> {

    // Dung cho luoi Phieu in nhanh de hien "Number Of Prints"/"Last Printing Time" cua dung cac
    // chung tu dang hien trong trang hien tai (khong tinh toan bo bang) - xem DeliveryOrderService/
    // GoodsIssueService.applyPrintSummary().
    @Query("""
            select p.docNumber as docNumber, count(p) as printCount, max(p.printedAt) as lastPrintedAt
            from PrintedNote p
            where p.docType = :docType and p.docNumber in :docNumbers
            group by p.docNumber
            """)
    List<PrintedNoteSummary> summarize(@Param("docType") String docType, @Param("docNumbers") List<String> docNumbers);
}
