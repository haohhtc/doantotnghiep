package com.erpqlkho.backend.inventory.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.common.response.PageResponse;
import com.erpqlkho.backend.inventory.dto.GoodsIssueDto;
import com.erpqlkho.backend.inventory.entity.GoodsIssue;
import com.erpqlkho.backend.inventory.service.GoodsIssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    // Dung rieng cho man hinh "Phieu in nhanh" (/sales/printed-note, Doc Type = Phieu xuat kho tong
    // hop) - loc server-side theo khoang ngay/ly do xuat/trang thai in, tranh tai toan bo bang nhu
    // GetMapping("") (cung long EAGER nang nhu DeliveryOrder tung gap - xem repository).
    @GetMapping("/print-search")
    public ApiResponse<PageResponse<GoodsIssue>> printSearch(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) java.time.LocalDate fromDate,
            @RequestParam(required = false) java.time.LocalDate toDate,
            @RequestParam(required = false) String reason,
            @RequestParam(defaultValue = "ALL") String printStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {
        var result = goodsIssueService.searchForPrint(branchId, fromDate, toDate, reason, printStatus, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
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
