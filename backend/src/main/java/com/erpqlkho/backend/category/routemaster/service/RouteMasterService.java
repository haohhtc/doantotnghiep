package com.erpqlkho.backend.category.routemaster.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.routemaster.dto.RouteMasterDto;
import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
import com.erpqlkho.backend.category.routemaster.entity.RouteMasterOutlet;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterOutletRepository;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterRepository;
import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import com.erpqlkho.backend.category.sellingzone.repository.SellingZoneRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteMasterService {

    private final RouteMasterRepository routeMasterRepository;
    private final RouteMasterOutletRepository routeMasterOutletRepository;
    private final SellingZoneRepository sellingZoneRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public List<RouteMaster> findAll() {
        return routeMasterRepository.findAll();
    }

    public RouteMaster findById(Long id) {
        return routeMasterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khung tuyen id=" + id));
    }

    @Transactional
    public RouteMaster create(RouteMasterDto dto) {
        if (routeMasterRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma khung tuyen da ton tai: " + dto.getCode());
        }

        RouteMaster route = new RouteMaster();
        applyDto(route, dto);

        return routeMasterRepository.save(route);
    }

    @Transactional
    public RouteMaster update(Long id, RouteMasterDto dto) {
        RouteMaster route = findById(id);

        if (!route.getCode().equals(dto.getCode()) && routeMasterRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma khung tuyen da ton tai: " + dto.getCode());
        }

        applyDto(route, dto);
        return routeMasterRepository.save(route);
    }

    // Khong co field "active" (dung thiet ke goc) - xoa han, chan neu dang bi route_setting tham chieu.
    @Transactional
    public void delete(Long id) {
        RouteMaster route = findById(id);
        try {
            routeMasterOutletRepository.deleteAll(routeMasterOutletRepository.findByRouteMasterId(id));
            routeMasterRepository.delete(route);
            routeMasterRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: khung tuyen dang duoc giao van hanh su dung");
        }
    }

    // --- Tab "List Of Outlet" ---

    public List<RouteMasterOutlet> findOutlets(Long routeMasterId) {
        findById(routeMasterId);
        return routeMasterOutletRepository.findByRouteMasterId(routeMasterId);
    }

    @Transactional
    public RouteMasterOutlet assignOutlet(Long routeMasterId, Long customerId) {
        RouteMaster route = findById(routeMasterId);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach hang id=" + customerId));

        if (routeMasterOutletRepository.existsByRouteMasterIdAndCustomerId(routeMasterId, customerId)) {
            throw ApiException.conflict("Khach hang nay da nam trong khung tuyen");
        }

        RouteMasterOutlet outlet = new RouteMasterOutlet();
        outlet.setRouteMaster(route);
        outlet.setCustomer(customer);
        outlet.setCreatedAt(LocalDateTime.now());

        return routeMasterOutletRepository.save(outlet);
    }

    @Transactional
    public void removeOutlet(Long routeMasterId, Long outletId) {
        RouteMasterOutlet outlet = routeMasterOutletRepository.findById(outletId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay outlet id=" + outletId));
        if (!outlet.getRouteMaster().getId().equals(routeMasterId)) {
            throw ApiException.notFound("Outlet nay khong thuoc khung tuyen id=" + routeMasterId);
        }
        routeMasterOutletRepository.delete(outlet);
    }

    private void applyDto(RouteMaster route, RouteMasterDto dto) {
        route.setCode(dto.getCode());
        route.setName(dto.getName());
        route.setType(dto.getType());
        route.setChannel(dto.getChannel());
        route.setSellingCategory(dto.getSellingCategory());
        route.setSellingZone(findSellingZone(dto.getSellingZoneId()));
        route.setBranch(findBranch(dto.getBranchId()));
        route.setManageBy(findUser(dto.getManageById()));
        route.setSalesman(findUser(dto.getSalesmanId()));
        route.setEffectiveDate(dto.getEffectiveDate());
        route.setEndDate(dto.getEndDate());
    }

    private SellingZone findSellingZone(Long id) {
        return sellingZoneRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay vung ban hang id=" + id));
    }

    private Branch findBranch(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay chi nhanh id=" + id));
    }

    private User findUser(Long id) {
        if (id == null) {
            return null;
        }
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nguoi dung id=" + id));
    }
}
