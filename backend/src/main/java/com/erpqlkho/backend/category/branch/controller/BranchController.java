package com.erpqlkho.backend.category.branch.controller;

import com.erpqlkho.backend.category.branch.dto.BranchDto;
import com.erpqlkho.backend.category.branch.dto.BranchProductDto;
import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.service.BranchService;
import com.erpqlkho.backend.category.product.entity.ItemBranch;
import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ApiResponse<List<Branch>> findAll() {
        return ApiResponse.ok(branchService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Branch> findById(@PathVariable Long id) {
        return ApiResponse.ok(branchService.findById(id));
    }

    @PostMapping
    public ApiResponse<Branch> create(@Valid @RequestBody BranchDto dto) {
        return ApiResponse.ok("Tao chi nhanh thanh cong", branchService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<Branch> update(@PathVariable Long id, @Valid @RequestBody BranchDto dto) {
        return ApiResponse.ok("Cap nhat chi nhanh thanh cong", branchService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        branchService.deactivate(id);
        return ApiResponse.ok("Da xoa chi nhanh", null);
    }

    // Item-Branch Assignment (chieu nguoc): chi nhanh nay dang ban nhung san pham nao.
    @GetMapping("/{id}/products")
    public ApiResponse<List<ItemBranch>> findProducts(@PathVariable Long id) {
        return ApiResponse.ok(branchService.findProducts(id));
    }

    @PostMapping("/{id}/products")
    public ApiResponse<ItemBranch> assignProduct(@PathVariable Long id, @Valid @RequestBody BranchProductDto dto) {
        return ApiResponse.ok("Da phan bo san pham cho chi nhanh", branchService.assignProduct(id, dto));
    }

    @DeleteMapping("/{id}/products/{itemBranchId}")
    public ApiResponse<Void> unassignProduct(@PathVariable Long id, @PathVariable Long itemBranchId) {
        branchService.unassignProduct(id, itemBranchId);
        return ApiResponse.ok("Da go phan bo san pham", null);
    }

    // Danh sach salesman (role SALES_STAFF) thuoc chi nhanh nay - xem tonghop.md muc "Nhan vien".
    @GetMapping("/{id}/salesmen")
    public ApiResponse<List<User>> findSalesmen(@PathVariable Long id) {
        return ApiResponse.ok(branchService.findSalesmen(id));
    }
}
