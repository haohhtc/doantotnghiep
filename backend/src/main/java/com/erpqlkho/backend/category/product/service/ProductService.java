package com.erpqlkho.backend.category.product.service;

import com.erpqlkho.backend.category.product.dto.ProductDto;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import com.erpqlkho.backend.category.productcategory.repository.ProductCategoryRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + id));
    }

    @Transactional
    public Product create(ProductDto dto) {
        if (productRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma san pham da ton tai: " + dto.getCode());
        }

        Product product = new Product();
        product.setCode(dto.getCode());
        product.setName(dto.getName());
        product.setForeignName(dto.getForeignName());
        product.setCategory(findCategory(dto.getCategoryId()));
        product.setUnit(dto.getUnit());
        product.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        product.setDescription(dto.getDescription());
        product.setActive(dto.getActive() == null || dto.getActive());

        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, ProductDto dto) {
        Product product = findById(id);

        if (!product.getCode().equals(dto.getCode()) && productRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma san pham da ton tai: " + dto.getCode());
        }

        product.setCode(dto.getCode());
        product.setName(dto.getName());
        product.setForeignName(dto.getForeignName());
        product.setCategory(findCategory(dto.getCategoryId()));
        product.setUnit(dto.getUnit());
        if (dto.getPrice() != null) {
            product.setPrice(dto.getPrice());
        }
        product.setDescription(dto.getDescription());
        if (dto.getActive() != null) {
            product.setActive(dto.getActive());
        }

        return productRepository.save(product);
    }

    // Soft-delete (giong pattern "lock" o UserService): giu lai lich su vi product
    // co the da duoc tham chieu boi goods_receipt_detail / sales_order_detail.
    @Transactional
    public void deactivate(Long id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    private ProductCategory findCategory(Long categoryId) {
        return productCategoryRepository.findById(categoryId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay danh muc id=" + categoryId));
    }
}
