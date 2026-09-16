package com.erpqlkho.backend.category.customer.service;

import com.erpqlkho.backend.category.customer.dto.CustomerDto;
import com.erpqlkho.backend.category.customer.dto.CustomerRouteInfoDto;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.category.customerchannel.entity.CustomerChannel;
import com.erpqlkho.backend.category.customerchannel.repository.CustomerChannelRepository;
import com.erpqlkho.backend.category.customergroup.repository.CustomerGroupMemberRepository;
import com.erpqlkho.backend.category.pricelist.entity.PriceList;
import com.erpqlkho.backend.category.pricelist.repository.PriceListRepository;
import com.erpqlkho.backend.category.routemaster.entity.RouteMasterOutlet;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterOutletRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.common.geography.GeographyResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final GeographyResolver geographyResolver;
    private final PriceListRepository priceListRepository;
    private final CustomerChannelRepository customerChannelRepository;
    private final CustomerGroupMemberRepository customerGroupMemberRepository;
    private final RouteMasterOutletRepository routeMasterOutletRepository;

    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khach hang id=" + id));
    }

    @Transactional
    public Customer create(CustomerDto dto) {
        if (customerRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma khach hang da ton tai: " + dto.getCode());
        }

        Customer customer = new Customer();
        customer.setCode(dto.getCode());
        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        customer.setActive(dto.getActive() == null || dto.getActive());
        applyGeography(customer, dto);
        customer.setPriceList(findPriceList(dto.getPriceListId()));
        customer.setChannel(findChannel(dto.getChannelId()));

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer update(Long id, CustomerDto dto) {
        Customer customer = findById(id);

        if (!customer.getCode().equals(dto.getCode()) && customerRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma khach hang da ton tai: " + dto.getCode());
        }

        customer.setCode(dto.getCode());
        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        if (dto.getActive() != null) {
            customer.setActive(dto.getActive());
        }
        applyGeography(customer, dto);
        customer.setPriceList(findPriceList(dto.getPriceListId()));
        customer.setChannel(findChannel(dto.getChannelId()));

        return customerRepository.save(customer);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi sales_order /
    // route_master_outlet de khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi than
    // ham nay ve "customer.setActive(false); customerRepository.save(customer);".
    @Transactional
    public void deactivate(Long id) {
        Customer customer = findById(id);
        // Go het thanh vien nhom (M:N) truoc - khong tinh la "dang duoc su dung" (chi la du lieu
        // mo ta/phan loai, khac han sales_order/route_master_outlet).
        customerGroupMemberRepository.deleteAll(customerGroupMemberRepository.findByCustomerId(id));
        try {
            customerRepository.delete(customer);
            customerRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: khach hang dang duoc su dung o don ban hang/tuyen ban hang khac");
        }
    }

    private void applyGeography(Customer customer, CustomerDto dto) {
        customer.setRegion(geographyResolver.resolveRegion(dto.getRegionId()));
        customer.setProvince(geographyResolver.resolveProvince(dto.getProvinceId()));
        customer.setDistrict(geographyResolver.resolveDistrict(dto.getDistrictId()));
        customer.setWard(geographyResolver.resolveWard(dto.getWardId()));
    }

    private PriceList findPriceList(Long id) {
        if (id == null) return null;
        return priceListRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay bang gia id=" + id));
    }

    private CustomerChannel findChannel(Long id) {
        if (id == null) return null;
        return customerChannelRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kenh ban hang id=" + id));
    }

    // Thong tin tuyen cua khach hang (chi nhanh + lich ghe tham) suy ra tu route_master_outlet -
    // dung cho Sales Order (Nhom 6). Khach hang chua duoc gan tuyen nao -> tra ve DTO rong (moi
    // field null/false), khong nem loi, de Frontend tu quyet dinh canh bao hay khong.
    public CustomerRouteInfoDto findRouteInfo(Long customerId) {
        findById(customerId);
        CustomerRouteInfoDto dto = new CustomerRouteInfoDto();
        Optional<RouteMasterOutlet> outletOpt = routeMasterOutletRepository.findByCustomerId(customerId);
        if (outletOpt.isEmpty()) return dto;

        RouteMasterOutlet outlet = outletOpt.get();
        var branch = outlet.getRouteMaster().getBranch();
        if (branch != null) {
            dto.setBranchId(branch.getId());
            dto.setBranchName(branch.getName());
        }
        dto.setMonday(outlet.isMonday());
        dto.setTuesday(outlet.isTuesday());
        dto.setWednesday(outlet.isWednesday());
        dto.setThursday(outlet.isThursday());
        dto.setFriday(outlet.isFriday());
        dto.setSaturday(outlet.isSaturday());
        dto.setSunday(outlet.isSunday());
        dto.setWeek1(outlet.isWeek1());
        dto.setWeek2(outlet.isWeek2());
        dto.setWeek3(outlet.isWeek3());
        dto.setWeek4(outlet.isWeek4());
        return dto;
    }
}
