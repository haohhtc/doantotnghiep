package com.erpqlkho.backend.common.response;

import org.springframework.data.domain.Page;

import java.util.List;

// Vo phan trang dung chung cho cac danh sach lon (xem SalesOrderController.search) - bao boc
// Page<T> cua Spring Data thanh JSON don gian, de FE doc (content/page/size/totalElements).
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> source) {
        return new PageResponse<>(
                source.getContent(),
                source.getNumber(),
                source.getSize(),
                source.getTotalElements(),
                source.getTotalPages());
    }
}
