package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.inventory.dto.GoodsIssueDto;
import com.erpqlkho.backend.inventory.entity.GoodsIssue;
import com.erpqlkho.backend.inventory.service.GoodsIssueService;
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
@RequestMapping("/api/goods-issues")
@RequiredArgsConstructor
public class GoodsIssueController {

    private final GoodsIssueService goodsIssueService;

    @GetMapping
    public ApiResponse<List<GoodsIssue>> findAll() {
        return ApiResponse.ok(goodsIssueService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<GoodsIssue> findById(@PathVariable Long id) {
        return ApiResponse.ok(goodsIssueService.findById(id));
    }

    @PostMapping
    public ApiResponse<GoodsIssue> create(@Valid @RequestBody GoodsIssueDto dto) {
        return ApiResponse.ok("Tao phieu xuat thanh cong", goodsIssueService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<GoodsIssue> update(@PathVariable Long id, @Valid @RequestBody GoodsIssueDto dto) {
        return ApiResponse.ok("Cap nhat phieu xuat thanh cong", goodsIssueService.update(id, dto));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<GoodsIssue> confirm(@PathVariable Long id) {
        return ApiResponse.ok("Da xac nhan phieu xuat - da tru ton kho", goodsIssueService.confirm(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        goodsIssueService.delete(id);
        return ApiResponse.ok("Da xoa phieu xuat", null);
    }
}
