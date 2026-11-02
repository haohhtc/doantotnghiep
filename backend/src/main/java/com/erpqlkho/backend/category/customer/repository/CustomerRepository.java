package com.erpqlkho.backend.category.customer.repository;

import com.erpqlkho.backend.category.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByCode(String code);

    // Dung cho luoi "Quan ly khach hang" (phan trang server-side) - loc theo chi nhanh/trang thai
    // hoat dong + tim theo ma/ten, moi nhat truoc. Xem CustomerController.search().
    @org.springframework.data.jpa.repository.Query("""
            select c from Customer c
            where (:branchId is null or c.branch.id = :branchId)
              and (:active is null or c.active = :active)
              and (:search is null or :search = ''
                   or lower(c.code) like lower(concat('%', :search, '%'))
                   or lower(c.name) like lower(concat('%', :search, '%')))
            order by c.id desc
            """)
    Page<Customer> search(@org.springframework.data.repository.query.Param("branchId") Long branchId,
                           @org.springframework.data.repository.query.Param("active") Boolean active,
                           @org.springframework.data.repository.query.Param("search") String search,
                           Pageable pageable);
}
