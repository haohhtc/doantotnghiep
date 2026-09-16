package com.erpqlkho.backend.category.routemaster.service;

import com.erpqlkho.backend.category.branch.entity.Branch;
import com.erpqlkho.backend.category.branch.repository.BranchRepository;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.employee.entity.Employee;
import com.erpqlkho.backend.category.employee.repository.EmployeeRepository;
import com.erpqlkho.backend.category.routemaster.dto.RouteAssignmentCloseDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteAssignmentDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteMasterDto;
import com.erpqlkho.backend.category.routemaster.dto.RouteMasterOutletDto;
import com.erpqlkho.backend.category.routemaster.entity.RouteManagerAssignment;
import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
import com.erpqlkho.backend.category.routemaster.entity.RouteMasterOutlet;
import com.erpqlkho.backend.category.routemaster.entity.RouteSalesmanAssignment;
import com.erpqlkho.backend.category.routemaster.repository.RouteManagerAssignmentRepository;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterOutletRepository;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterRepository;
import com.erpqlkho.backend.category.routemaster.repository.RouteSalesmanAssignmentRepository;
import com.erpqlkho.backend.category.sellingzone.entity.SellingZone;
import com.erpqlkho.backend.category.sellingzone.repository.SellingZoneRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final RouteSalesmanAssignmentRepository routeSalesmanAssignmentRepository;
    private final RouteManagerAssignmentRepository routeManagerAssignmentRepository;
    private final EmployeeRepository employeeRepository;

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
    public RouteMasterOutlet assignOutlet(Long routeMasterId, RouteMasterOutletDto dto) {
        RouteMaster route = findById(routeMasterId);
        Long customerId = dto.getCustomerId();
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach hang id=" + customerId));

        // 1 khach hang chi duoc thuoc 1 tuyen - kiem tra ton tai (khong theo ngay) tren TOAN BO
        // route_master_outlet, khong chi rieng khung tuyen nay.
        if (routeMasterOutletRepository.existsByCustomerId(customerId)) {
            throw ApiException.conflict("Khach hang nay da thuoc mot khung tuyen khac - 1 khach hang chi duoc thuoc 1 tuyen");
        }

        RouteMasterOutlet outlet = new RouteMasterOutlet();
        outlet.setRouteMaster(route);
        outlet.setCustomer(customer);
        outlet.setCreatedAt(LocalDateTime.now());
        applyOutletSchedule(outlet, dto);

        return routeMasterOutletRepository.save(outlet);
    }

    private void applyOutletSchedule(RouteMasterOutlet outlet, RouteMasterOutletDto dto) {
        outlet.setVisitOrder(dto.getVisitOrder());
        outlet.setMonday(Boolean.TRUE.equals(dto.getMonday()));
        outlet.setTuesday(Boolean.TRUE.equals(dto.getTuesday()));
        outlet.setWednesday(Boolean.TRUE.equals(dto.getWednesday()));
        outlet.setThursday(Boolean.TRUE.equals(dto.getThursday()));
        outlet.setFriday(Boolean.TRUE.equals(dto.getFriday()));
        outlet.setSaturday(Boolean.TRUE.equals(dto.getSaturday()));
        outlet.setSunday(Boolean.TRUE.equals(dto.getSunday()));
        outlet.setWeek1(Boolean.TRUE.equals(dto.getWeek1()));
        outlet.setWeek2(Boolean.TRUE.equals(dto.getWeek2()));
        outlet.setWeek3(Boolean.TRUE.equals(dto.getWeek3()));
        outlet.setWeek4(Boolean.TRUE.equals(dto.getWeek4()));
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

    // --- Timeline NVBH/Quan ly cua khung tuyen (route_salesman_assignment / route_manager_assignment)
    // - THAY THE han RouteSetting cu, 2 timeline doc lap - xem tonghop.md muc "Nhi dat hang lon" Nhom 5.

    public List<RouteSalesmanAssignment> findSalesmanAssignments(Long routeMasterId) {
        findById(routeMasterId);
        return routeSalesmanAssignmentRepository.findByRouteMasterIdOrderByEffectiveDateAsc(routeMasterId);
    }

    @Transactional
    public RouteSalesmanAssignment addSalesmanAssignment(Long routeMasterId, RouteAssignmentDto dto) {
        RouteMaster route = findById(routeMasterId);
        Employee employee = findEmployee(dto.getEmployeeId());
        List<RouteSalesmanAssignment> existing = routeSalesmanAssignmentRepository
                .findByRouteMasterIdOrderByEffectiveDateAsc(routeMasterId);

        validateActiveRowEndDate(route, dto.getEffectiveDate(), dto.getEndDate());
        for (RouteSalesmanAssignment a : existing) {
            validateNoOverlap(a.getEffectiveDate(), a.getEndDate(), dto.getEffectiveDate(), dto.getEndDate());
        }

        RouteSalesmanAssignment assignment = new RouteSalesmanAssignment();
        assignment.setRouteMaster(route);
        assignment.setEmployee(employee);
        assignment.setEffectiveDate(dto.getEffectiveDate());
        assignment.setEndDate(dto.getEndDate());
        return routeSalesmanAssignmentRepository.save(assignment);
    }

    @Transactional
    public RouteSalesmanAssignment closeSalesmanAssignment(Long routeMasterId, Long assignmentId, RouteAssignmentCloseDto dto) {
        RouteMaster route = findById(routeMasterId);
        RouteSalesmanAssignment assignment = routeSalesmanAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong phan bo id=" + assignmentId));
        if (!assignment.getRouteMaster().getId().equals(routeMasterId)) {
            throw ApiException.notFound("Dong phan bo nay khong thuoc khung tuyen id=" + routeMasterId);
        }
        validateCloseEndDate(route, assignment.getEffectiveDate(), dto.getEndDate());
        assignment.setEndDate(dto.getEndDate());
        return routeSalesmanAssignmentRepository.save(assignment);
    }

    public List<RouteManagerAssignment> findManagerAssignments(Long routeMasterId) {
        findById(routeMasterId);
        return routeManagerAssignmentRepository.findByRouteMasterIdOrderByEffectiveDateAsc(routeMasterId);
    }

    @Transactional
    public RouteManagerAssignment addManagerAssignment(Long routeMasterId, RouteAssignmentDto dto) {
        RouteMaster route = findById(routeMasterId);
        Employee employee = findEmployee(dto.getEmployeeId());
        List<RouteManagerAssignment> existing = routeManagerAssignmentRepository
                .findByRouteMasterIdOrderByEffectiveDateAsc(routeMasterId);

        validateActiveRowEndDate(route, dto.getEffectiveDate(), dto.getEndDate());
        for (RouteManagerAssignment a : existing) {
            validateNoOverlap(a.getEffectiveDate(), a.getEndDate(), dto.getEffectiveDate(), dto.getEndDate());
        }

        RouteManagerAssignment assignment = new RouteManagerAssignment();
        assignment.setRouteMaster(route);
        assignment.setEmployee(employee);
        assignment.setEffectiveDate(dto.getEffectiveDate());
        assignment.setEndDate(dto.getEndDate());
        return routeManagerAssignmentRepository.save(assignment);
    }

    @Transactional
    public RouteManagerAssignment closeManagerAssignment(Long routeMasterId, Long assignmentId, RouteAssignmentCloseDto dto) {
        RouteMaster route = findById(routeMasterId);
        RouteManagerAssignment assignment = routeManagerAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay dong phan bo id=" + assignmentId));
        if (!assignment.getRouteMaster().getId().equals(routeMasterId)) {
            throw ApiException.notFound("Dong phan bo nay khong thuoc khung tuyen id=" + routeMasterId);
        }
        validateCloseEndDate(route, assignment.getEffectiveDate(), dto.getEndDate());
        assignment.setEndDate(dto.getEndDate());
        return routeManagerAssignmentRepository.save(assignment);
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay nhan vien id=" + id));
    }

    // Dong dang tao (chua bi dong) chi ap dung rule end_date cho DONG MOI dang tao o day - cac dong
    // lich su da dong truoc do khong bi kiem tra lai (da co end_date rieng tu luc dong).
    private void validateActiveRowEndDate(RouteMaster route, LocalDate effectiveDate, LocalDate endDate) {
        if (route.getEndDate() == null) {
            if (endDate != null) {
                throw new ApiException("Khung tuyen chua co ngay ket thuc nen dong phan bo nay khong duoc nhap ngay ket thuc");
            }
        } else {
            if (endDate == null) {
                throw new ApiException("Khung tuyen da co ngay ket thuc nen dong phan bo nay bat buoc phai nhap ngay ket thuc");
            }
            if (endDate.isAfter(route.getEndDate())) {
                throw new ApiException("Ngay ket thuc khong duoc vuot qua ngay ket thuc cua khung tuyen (" + route.getEndDate() + ")");
            }
        }
        if (endDate != null && endDate.isBefore(effectiveDate)) {
            throw new ApiException("Ngay ket thuc khong duoc truoc ngay hieu luc");
        }
    }

    // Cho phep co khoang trong giua 2 nguoi, chi cam chong lan khoang thoi gian.
    private void validateNoOverlap(LocalDate existingStart, LocalDate existingEnd, LocalDate newStart, LocalDate newEnd) {
        LocalDate existingEndOrMax = existingEnd != null ? existingEnd : LocalDate.MAX;
        LocalDate newEndOrMax = newEnd != null ? newEnd : LocalDate.MAX;
        boolean overlap = !newStart.isAfter(existingEndOrMax) && !existingStart.isAfter(newEndOrMax);
        if (overlap) {
            throw ApiException.conflict("Khoang thoi gian bi chong lap voi 1 dong phan bo khac (hieu luc "
                    + existingStart + " den " + (existingEnd != null ? existingEnd : "chua ket thuc") + ")");
        }
    }

    // Khi dong 1 dong phan bo dang hoat dong (doi nhan su): end_date phai >= CURRENT_DATE (khong
    // cho lui ve qua khu), khong truoc effective_date cua chinh no, va khong vuot qua end_date cua
    // khung tuyen (neu co).
    private void validateCloseEndDate(RouteMaster route, LocalDate assignmentEffectiveDate, LocalDate closeEndDate) {
        if (closeEndDate.isBefore(LocalDate.now())) {
            throw new ApiException("Ngay ket thuc khi dong dong phan bo phai tu hom nay tro di, khong duoc lui ve qua khu");
        }
        if (closeEndDate.isBefore(assignmentEffectiveDate)) {
            throw new ApiException("Ngay ket thuc khong duoc truoc ngay hieu luc cua dong phan bo");
        }
        if (route.getEndDate() != null && closeEndDate.isAfter(route.getEndDate())) {
            throw new ApiException("Ngay ket thuc khong duoc vuot qua ngay ket thuc cua khung tuyen (" + route.getEndDate() + ")");
        }
    }
}
