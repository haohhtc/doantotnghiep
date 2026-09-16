package com.erpqlkho.backend.category.routemaster.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// Dong 1 dong phan bo dang hoat dong (vd doi nhan su) - end_date phai >= CURRENT_DATE.
@Getter
@Setter
public class RouteAssignmentCloseDto {

    @NotNull(message = "Ngay ket thuc khong duoc de trong")
    private LocalDate endDate;
}
