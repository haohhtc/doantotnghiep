package com.erpqlkho.backend.category.customer.service;

import com.erpqlkho.backend.category.customer.dto.CustomerDto;
import com.erpqlkho.backend.category.customer.entity.Customer;
import com.erpqlkho.backend.category.customer.repository.CustomerRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

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

        return customerRepository.save(customer);
    }

    // Soft-delete (giong pattern ProductService): giu lai lich su vi customer co the
    // da duoc tham chieu boi sales_order.
    @Transactional
    public void deactivate(Long id) {
        Customer customer = findById(id);
        customer.setActive(false);
        customerRepository.save(customer);
    }
}
