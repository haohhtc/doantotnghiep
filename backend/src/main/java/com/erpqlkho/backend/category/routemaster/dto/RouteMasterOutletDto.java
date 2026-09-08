package com.erpqlkho.backend.category.routemaster.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteMasterOutletDto {

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;
}
