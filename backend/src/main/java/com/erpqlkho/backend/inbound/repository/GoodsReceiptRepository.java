package com.erpqlkho.backend.inbound.repository;

import com.erpqlkho.backend.inbound.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    boolean existsByDocNumber(String docNumber);

    // Dung cho luoi "Quan ly nhap hang" (phan trang server-side) - loc theo chi nhanh (qua kho) +
    // tim theo so phieu/ten nha cung cap, moi nhat truoc. Xem GoodsReceiptController.search().
    @org.springframework.data.jpa.repository.Query("""
            select g from GoodsReceipt g
            where (:branchId is null or g.warehouse.branch.id = :branchId)
              and (:search is null or :search = ''
                   or lower(g.docNumber) like lower(concat('%', :search, '%'))
                   or lower(g.supplier.name) like lower(concat('%', :search, '%')))
            order by g.id desc
            """)
    Page<GoodsReceipt> search(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                               @org.springframework.data.repository.query.Param("search") String search,
                               Pageable pageable);
}
