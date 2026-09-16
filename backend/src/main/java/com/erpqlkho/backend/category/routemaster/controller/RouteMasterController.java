package com.erpqlkho.backend.category.routemaster.controller;

import com.erpqlkho.backend.category.routemaster.dto.RouteAssignmentCloseDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteAssignmentDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteMasterDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteMasterOutletDto;
import com.erpqlkho.backend.category.routemaster.entity.RouteManagerAssignment;
import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
import com.erpqlkho.backend.category.routemaster.entity.RouteMasterOutlet;
import com.erpqlkho.backend.category.routemaster.entity.RouteSalesmanAssignment;
import com.erpqlkho.backend.category.routemaster.service.RouteMasterService;
import com.erpqlkho.backend.common.response.ApiResponse;
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
@RequestMapping("/api/route-masters")
@RequiredArgsConstructor
public class RouteMasterController {

    private final RouteMasterService routeMasterService;

    @GetMapping
    public ApiResponse<List<RouteMaster>> findAll() {
        return ApiResponse.ok(routeMasterService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<RouteMaster> findById(@PathVariable Long id) {
        return ApiResponse.ok(routeMasterService.findById(id));
    }

    @PostMapping
    public ApiResponse<RouteMaster> create(@Valid @RequestBody RouteMasterDto dto) {
        return ApiResponse.ok("Tao khung tuyen thanh cong", routeMasterService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<RouteMaster> update(@PathVariable Long id, @Valid @RequestBody RouteMasterDto dto) {
        return ApiResponse.ok("Cap nhat khung tuyen thanh cong", routeMasterService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        routeMasterService.delete(id);
        return ApiResponse.ok("Da xoa khung tuyen", null);
    }

    // Tab "List Of Outlet": gan/go khach hang khoi khung tuyen.
    @GetMapping("/{id}/outlets")
    public ApiResponse<List<RouteMasterOutlet>> findOutlets(@PathVariable Long id) {
        return ApiResponse.ok(routeMasterService.findOutlets(id));
    }

    @PostMapping("/{id}/outlets")
    public ApiResponse<RouteMasterOutlet> assignOutlet(@PathVariable Long id, @Valid @RequestBody RouteMasterOutletDto dto) {
        return ApiResponse.ok("Da them khach hang vao khung tuyen", routeMasterService.assignOutlet(id, dto));
    }

    @DeleteMapping("/{id}/outlets/{outletId}")
    public ApiResponse<Void> removeOutlet(@PathVariable Long id, @PathVariable Long outletId) {
        routeMasterService.removeOutlet(id, outletId);
        return ApiResponse.ok("Da go khach hang khoi khung tuyen", null);
    }

    // Timeline NVBH - THAY THE han RouteSetting cu (xem tonghop.md Nhom 5).
    @GetMapping("/{id}/salesman-assignments")
    public ApiResponse<List<RouteSalesmanAssignment>> findSalesmanAssignments(@PathVariable Long id) {
        return ApiResponse.ok(routeMasterService.findSalesmanAssignments(id));
    }

    @PostMapping("/{id}/salesman-assignments")
    public ApiResponse<RouteSalesmanAssignment> addSalesmanAssignment(@PathVariable Long id, @Valid @RequestBody RouteAssignmentDto dto) {
        return ApiResponse.ok("Da them phan bo NVBH", routeMasterService.addSalesmanAssignment(id, dto));
    }

    @PostMapping("/{id}/salesman-assignments/{assignmentId}/close")
    public ApiResponse<RouteSalesmanAssignment> closeSalesmanAssignment(
            @PathVariable Long id, @PathVariable Long assignmentId, @Valid @RequestBody RouteAssignmentCloseDto dto) {
        return ApiResponse.ok("Da dong phan bo NVBH", routeMasterService.closeSalesmanAssignment(id, assignmentId, dto));
    }

    // Timeline Quan ly - doc lap voi timeline NVBH.
    @GetMapping("/{id}/manager-assignments")
    public ApiResponse<List<RouteManagerAssignment>> findManagerAssignments(@PathVariable Long id) {
        return ApiResponse.ok(routeMasterService.findManagerAssignments(id));
    }

    @PostMapping("/{id}/manager-assignments")
    public ApiResponse<RouteManagerAssignment> addManagerAssignment(@PathVariable Long id, @Valid @RequestBody RouteAssignmentDto dto) {
        return ApiResponse.ok("Da them phan bo Quan ly", routeMasterService.addManagerAssignment(id, dto));
    }

    @PostMapping("/{id}/manager-assignments/{assignmentId}/close")
    public ApiResponse<RouteManagerAssignment> closeManagerAssignment(
            @PathVariable Long id, @PathVariable Long assignmentId, @Valid @RequestBody RouteAssignmentCloseDto dto) {
        return ApiResponse.ok("Da dong phan bo Quan ly", routeMasterService.closeManagerAssignment(id, assignmentId, dto));
    }
}
