package com.erpqlkho.backend.category.customer.service;

import com.erpqlkho.backend.category.customer.dto.CustomerDto;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.common.geography.GeographyResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final GeographyResolver geographyResolver;

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

        return customerRepository.save(customer);
    }

    // TAM THOI doi tu soft-delete sang xoa that (hard delete) theo yeu cau - de admin don duoc
    // du lieu test/rac khoi DB. Van chan neu dang bi tham chieu boi sales_order /
    // route_master_outlet de khong pha rang buoc khoa ngoai. Muon quay lai soft-delete: doi than
    // ham nay ve "customer.setActive(false); customerRepository.save(customer);".
    @Transactional
    public void deactivate(Long id) {
        Customer customer = findById(id);
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
}
