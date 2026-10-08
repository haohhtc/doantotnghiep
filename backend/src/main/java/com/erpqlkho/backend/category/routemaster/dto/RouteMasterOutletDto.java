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

    // Danh sach tuan cu the trong nam (1-53), cach nhau dau phay - VD "3,7,11,15".
    private String visitWeeks;
}
