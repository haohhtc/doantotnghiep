package com.erpqlkho.backend.category.customerchannel.service;

import com.erpqlkho.backend.category.customerchannel.dto.CustomerChannelDto;
import com.erpqlkho.backend.category.customerchannel.entity.CustomerChannel;
import com.erpqlkho.backend.category.customerchannel.repository.CustomerChannelRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerChannelService {

    private final CustomerChannelRepository customerChannelRepository;

    public List<CustomerChannel> findAll() {
        return customerChannelRepository.findAll();
    }

    public CustomerChannel findById(Long id) {
        return customerChannelRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay kenh ban hang id=" + id));
    }

    @Transactional
    public CustomerChannel create(CustomerChannelDto dto) {
        if (customerChannelRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma kenh ban hang da ton tai: " + dto.getCode());
        }
        CustomerChannel channel = new CustomerChannel();
        channel.setCode(dto.getCode());
        channel.setName(dto.getName());
        channel.setDescription(dto.getDescription());
        return customerChannelRepository.save(channel);
    }

    @Transactional
    public CustomerChannel update(Long id, CustomerChannelDto dto) {
        CustomerChannel channel = findById(id);
        if (!channel.getCode().equals(dto.getCode()) && customerChannelRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma kenh ban hang da ton tai: " + dto.getCode());
        }
        channel.setCode(dto.getCode());
        channel.setName(dto.getName());
        channel.setDescription(dto.getDescription());
        return customerChannelRepository.save(channel);
    }

    @Transactional
    public void delete(Long id) {
        CustomerChannel channel = findById(id);
        try {
            customerChannelRepository.delete(channel);
            customerChannelRepository.flush();
        } catch (Exception e) {
            throw ApiException.conflict("Khong the xoa: kenh ban hang dang duoc khach hang khac su dung");
        }
    }
}
