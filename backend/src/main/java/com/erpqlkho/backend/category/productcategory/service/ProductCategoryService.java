package com.erpqlkho.backend.category.productcategory.service;

import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.productcategory.dto.ProductCategoryDto;
import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import com.erpqlkho.backend.category.productcategory.repository.ProductCategoryRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCategoryService {

    private final ProductCategoryRepository productCategoryRepository;
    private final ProductRepository productRepository;

    public List<ProductCategory> findAll() {
        return productCategoryRepository.findAll();
    }

    public ProductCategory findById(Long id) {
        return productCategoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay danh muc id=" + id));
    }

    @Transactional
    public ProductCategory create(ProductCategoryDto dto) {
        if (productCategoryRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma danh muc da ton tai: " + dto.getCode());
        }

        ProductCategory category = new ProductCategory();
        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setParent(resolveParent(dto.getParentId(), null));

        return productCategoryRepository.save(category);
    }

    @Transactional
    public ProductCategory update(Long id, ProductCategoryDto dto) {
        ProductCategory category = findById(id);

        if (!category.getCode().equals(dto.getCode()) && productCategoryRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma danh muc da ton tai: " + dto.getCode());
        }

        category.setCode(dto.getCode());
        category.setName(dto.getName());
        category.setParent(resolveParent(dto.getParentId(), id));

        return productCategoryRepository.save(category);
    }

    @Transactional
    public void delete(Long id) {
        ProductCategory category = findById(id);

        if (productCategoryRepository.existsByParentId(id)) {
            throw ApiException.conflict("Khong the xoa: danh muc dang co danh muc con");
        }
        if (productRepository.existsByCategoryId(id)) {
            throw ApiException.conflict("Khong the xoa: danh muc dang co san pham");
        }

        productCategoryRepository.delete(category);
    }

    private ProductCategory resolveParent(Long parentId, Long selfId) {
        if (parentId == null) {
            return null;
        }
        if (parentId.equals(selfId)) {
            throw new ApiException("Danh muc khong the la cha cua chinh no");
        }
        return productCategoryRepository.findById(parentId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay danh muc cha id=" + parentId));
    }
}
