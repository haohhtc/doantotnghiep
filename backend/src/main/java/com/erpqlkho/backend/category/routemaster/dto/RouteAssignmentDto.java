package com.erpqlkho.backend.category.routemaster.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

// Dung chung cho ca 2 timeline (Salesman/Manager) - tao 1 dong phan bo nhan su moi cho khung tuyen.
@Getter
@Setter
public class RouteAssignmentDto {

    @NotNull(message = "Nhan vien khong duoc de trong")
    private Long employeeId;

    @NotNull(message = "Ngay hieu luc khong duoc de trong")
    private LocalDate effectiveDate;

    // Bat buoc neu RouteMaster co end_date; de trong neu RouteMaster con dang hoat dong (khong end_date).
    private LocalDate endDate;
}
