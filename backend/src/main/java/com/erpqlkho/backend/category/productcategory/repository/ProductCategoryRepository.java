package com.erpqlkho.backend.category.productcategory.repository;

import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {

    boolean existsByCode(String code);

    boolean existsByParentId(Long parentId);
}
