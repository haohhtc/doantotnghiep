package com.erpqlkho.backend.category.routemaster.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteMasterOutletDto {

    @NotNull(message = "Khach hang khong duoc de trong")
    private Long customerId;

    private Integer visitOrder;

    private Boolean monday;
    private Boolean tuesday;
    private Boolean wednesday;
    private Boolean thursday;
    private Boolean friday;
    private Boolean saturday;
    private Boolean sunday;

    private Boolean week1;
    private Boolean week2;
    private Boolean week3;
    private Boolean week4;
}
