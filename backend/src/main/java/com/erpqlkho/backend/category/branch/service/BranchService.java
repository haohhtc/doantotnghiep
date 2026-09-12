package com.erpqlkho.backend.category.branch.service;

import com.erpqlkho.backend.category.branch.dto.BranchDto;
import com.erpqlkho.backend.category.branch.dto.BranchProductDto;
import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.category.company.entity.Company;
import com.erpqlkho.backend.category.company.repository.CompanyRepository;
import com.erpqlkho.backend.category.product.entity.ItemBranch;
import com.erpqlkho.backend.category.product.entity.Product;
import com.erpqlkho.backend.category.pricelist.entity.PriceList;
import com.erpqlkho.backend.category.pricelist.repository.PriceListRepository;
import com.erpqlkho.backend.category.product.repository.ItemBranchRepository;
import com.erpqlkho.backend.category.product.repository.ProductRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.common.geography.GeographyResolver;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final CompanyRepository companyRepository;
    private final GeographyResolver geographyResolver;
    private final ItemBranchRepository itemBranchRepository;
    private final ProductRepository productRepository;
    private final PriceListRepository priceListRepository;
    private final UserRepository userRepository;

    public List<Branch> findAll() {
        return branchRepository.findAll();
    }

    public Branch findById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + id));
    }

    @Transactional
    public Branch create(BranchDto dto) {
        if (branchRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chi nhanh da ton tai: " + dto.getCode());
        }

        Branch branch = new Branch();
        branch.setCode(dto.getCode());
        branch.setName(dto.getName());
        branch.setAddress(dto.getAddress());
        branch.setPhone(dto.getPhone());
        branch.setActive(dto.getActive() == null || dto.getActive());
        branch.setCompany(findCompany(dto.getCompanyId()));
        applyGeography(branch, dto);
        branch.setPriceList(findPriceList(dto.getPriceListId()));

        return branchRepository.save(branch);
    }

    @Transactional
    public Branch update(Long id, BranchDto dto) {
        Branch branch = findById(id);

        if (!branch.getCode().equals(dto.getCode()) && branchRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma chi nhanh da ton tai: " + dto.getCode());
        }

        branch.setCode(dto.getCode());
        branch.setName(dto.getName());
        branch.setAddress(dto.getAddress());
        branch.setPhone(dto.getPhone());
        if (dto.getActive() != null) {
            branch.setActive(dto.getActive());
        }
        branch.setCompany(findCompany(dto.getCompanyId()));
        applyGeography(branch, dto);
        branch.setPriceList(findPriceList(dto.getPriceListId()));

        return branchRepository.save(branch);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi selling_zone/route_master de
    // khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi than ham nay ve
    // "branch.setActive(false); branchRepository.save(branch);".
    @Transactional
    public void deactivate(Long id) {
        Branch branch = findById(id);
        try {
            branchRepository.delete(branch);
            branchRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: chi nhanh dang duoc su dung o vung ban hang/khung tuyen khac");
        }
    }

    private Company findCompany(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cong ty id=" + id));
    }

    private PriceList findPriceList(Long id) {
        if (id == null) return null;
        return priceListRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay bang gia id=" + id));
    }

    private void applyGeography(Branch branch, BranchDto dto) {
        branch.setRegion(geographyResolver.resolveRegion(dto.getRegionId()));
        branch.setProvince(geographyResolver.resolveProvince(dto.getProvinceId()));
        branch.setDistrict(geographyResolver.resolveDistrict(dto.getDistrictId()));
        branch.setWard(geographyResolver.resolveWard(dto.getWardId()));
    }

    // --- Item-Branch Assignment (chieu nguoc): chi nhanh nay dang ban nhung san pham nao ---

    public List<ItemBranch> findProducts(Long branchId) {
        findById(branchId);
        return itemBranchRepository.findByBranchId(branchId);
    }

    @Transactional
    public ItemBranch assignProduct(Long branchId, BranchProductDto dto) {
        Branch branch = findById(branchId);
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay san pham id=" + dto.getProductId()));

        if (itemBranchRepository.existsByProductIdAndBranchId(dto.getProductId(), branchId)) {
            throw ApiException.conflict("San pham nay da duoc phan bo cho chi nhanh nay");
        }

        ItemBranch itemBranch = new ItemBranch();
        itemBranch.setProduct(product);
        itemBranch.setBranch(branch);
        itemBranch.setCreatedAt(LocalDateTime.now());
        return itemBranchRepository.save(itemBranch);
    }

    @Transactional
    public void unassignProduct(Long branchId, Long itemBranchId) {
        ItemBranch itemBranch = itemBranchRepository.findById(itemBranchId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay phan bo id=" + itemBranchId));
        if (!itemBranch.getBranch().getId().equals(branchId)) {
            throw ApiException.notFound("Phan bo nay khong thuoc chi nhanh id=" + branchId);
        }
        itemBranchRepository.delete(itemBranch);
    }

    // Danh sach salesman (User co role SALES_STAFF) dang thuoc chi nhanh nay - dung cho man hinh
    // Route Master chon salesman theo tung chi nhanh. Xem tonghop.md muc "Nhan vien".
    public List<User> findSalesmen(Long branchId) {
        findById(branchId);
        return userRepository.findByBranchIdAndRole_Code(branchId, "SALES_STAFF");
    }
}
