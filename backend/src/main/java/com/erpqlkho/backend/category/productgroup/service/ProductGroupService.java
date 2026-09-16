package com.erpqlkho.backend.category.productgroup.service;

import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.productgroup.dto.ProductGroupDto;
import com.erpqlkho.backend.category.productgroup.dto.ProductGroupItemDto;
import com.erpqlkho.backend.category.productgroup.entity.ProductGroup;
import com.erpqlkho.backend.category.productgroup.entity.ProductGroupItem;
import com.erpqlkho.backend.category.productgroup.repository.ProductGroupItemRepository;
import com.erpqlkho.backend.category.productgroup.repository.ProductGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductGroupService {

    private final ProductGroupRepository productGroupRepository;
    private final ProductGroupItemRepository productGroupItemRepository;
    private final ProductRepository productRepository;

    public List<ProductGroup> findAll() {
        return productGroupRepository.findAll();
    }

    public ProductGroup findById(Long id) {
        return productGroupRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom san pham id=" + id));
    }

    @Transactional
    public ProductGroup create(ProductGroupDto dto) {
        if (productGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom san pham da ton tai: " + dto.getCode());
        }
        ProductGroup group = new ProductGroup();
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return productGroupRepository.save(group);
    }

    @Transactional
    public ProductGroup update(Long id, ProductGroupDto dto) {
        ProductGroup group = findById(id);
        if (!group.getCode().equals(dto.getCode()) && productGroupRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma nhom san pham da ton tai: " + dto.getCode());
        }
        group.setCode(dto.getCode());
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        return productGroupRepository.save(group);
    }

    @Transactional
    public void delete(Long id) {
        ProductGroup group = findById(id);
        productGroupItemRepository.deleteAll(productGroupItemRepository.findByProductGroupId(id));
        productGroupRepository.delete(group);
    }

    // --- San pham trong nhom ---

    public List<ProductGroupItem> findItems(Long groupId) {
        findById(groupId);
        return productGroupItemRepository.findByProductGroupId(groupId);
    }

    @Transactional
    public ProductGroupItem addItem(Long groupId, ProductGroupItemDto dto) {
        ProductGroup group = findById(groupId);
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + dto.getProductId()));

        if (productGroupItemRepository.existsByProductGroupIdAndProductId(groupId, dto.getProductId())) {
            throw ApiException.conflict("San pham nay da co trong nhom");
        }

        ProductGroupItem item = new ProductGroupItem();
        item.setProductGroup(group);
        item.setProduct(product);
        item.setCreatedAt(LocalDateTime.now());
        return productGroupItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long groupId, Long itemId) {
        ProductGroupItem item = productGroupItemRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong id=" + itemId));
        if (!item.getProductGroup().getId().equals(groupId)) {
            throw ApiException.notFound("Dong nay khong thuoc nhom san pham id=" + groupId);
        }
        productGroupItemRepository.delete(item);
    }
}
