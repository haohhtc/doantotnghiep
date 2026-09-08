package com.erpqlkho.backend.category.product.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.category.product.dto.ItemBranchDto;
import com.erpqlkho.backend.category.product.dto.ProductDto;
import com.erpqlkho.backend.category.product.entity.ItemBranch;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.product.repository.ItemBranchRepository;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.category.productcategory.entity.ProductCategory;
import com.erpqlkho.backend.category.productcategory.repository.ProductCategoryRepository;
import com.erpqlkho.backend.category.taxgroup.repository.TaxGroupRepository;
import com.erpqlkho.backend.category.uom.repository.UomRepository;
import com.erpqlkho.backend.category.uomgroup.repository.UomGroupRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final UomRepository uomRepository;
    private final UomGroupRepository uomGroupRepository;
    private final TaxGroupRepository taxGroupRepository;
    private final ItemBranchRepository itemBranchRepository;
    private final BranchRepository branchRepository;

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
        applyMdm(product, dto);

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
        applyMdm(product, dto);

        return productRepository.save(product);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi goods_receipt_detail /
    // sales_order_detail de khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi than
    // ham nay ve "product.setActive(false); productRepository.save(product);".
    @Transactional
    public void deactivate(Long id) {
        Product product = findById(id);
        try {
            productRepository.delete(product);
            productRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: san pham dang duoc su dung o phieu nhap/don ban hang khac");
        }
    }

    private ProductCategory findCategory(Long categoryId) {
        return productCategoryRepository.findById(categoryId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay danh muc id=" + categoryId));
    }

    private void applyMdm(Product product, ProductDto dto) {
        product.setUom(dto.getUomId() != null
                ? uomRepository.findById(dto.getUomId())
                        .orElseThrow(() -> ApiException.notFound("Khong tim thay don vi tinh id=" + dto.getUomId()))
                : null);
        product.setUomGroup(dto.getUomGroupId() != null
                ? uomGroupRepository.findById(dto.getUomGroupId())
                        .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom don vi tinh id=" + dto.getUomGroupId()))
                : null);
        product.setTaxGroup(dto.getTaxGroupId() != null
                ? taxGroupRepository.findById(dto.getTaxGroupId())
                        .orElseThrow(() -> ApiException.notFound("Khong tim thay nhom thue id=" + dto.getTaxGroupId()))
                : null);
    }

    // --- Item-Branch Assignment: phan bo san pham theo chi nhanh ---

    public List<ItemBranch> findBranches(Long productId) {
        findById(productId);
        return itemBranchRepository.findByProductId(productId);
    }

    @Transactional
    public ItemBranch assignBranch(Long productId, ItemBranchDto dto) {
        Product product = findById(productId);
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + dto.getBranchId()));

        if (itemBranchRepository.existsByProductIdAndBranchId(productId, dto.getBranchId())) {
            throw ApiException.conflict("San pham nay da duoc phan bo cho chi nhanh nay");
        }

        ItemBranch itemBranch = new ItemBranch();
        itemBranch.setProduct(product);
        itemBranch.setBranch(branch);
        itemBranch.setCreatedAt(LocalDateTime.now());
        return itemBranchRepository.save(itemBranch);
    }

    @Transactional
    public void unassignBranch(Long productId, Long itemBranchId) {
        ItemBranch itemBranch = itemBranchRepository.findById(itemBranchId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phan bo id=" + itemBranchId));
        if (!itemBranch.getProduct().getId().equals(productId)) {
            throw ApiException.notFound("Phan bo nay khong thuoc san pham id=" + productId);
        }
        itemBranchRepository.delete(itemBranch);
    }
}
