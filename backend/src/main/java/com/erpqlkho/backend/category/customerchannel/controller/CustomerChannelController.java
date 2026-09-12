package com.erpqlkho.backend.category.customerchannel.controller;

import com.erpqlkho.backend.category.customerchannel.dto.CustomerChannelDto;
import com.erpqlkho.backend.category.customerchannel.entity.CustomerChannel;
import com.erpqlkho.backend.category.customerchannel.service.CustomerChannelService;
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
@RequestMapping("/api/customer-channels")
@RequiredArgsConstructor
public class CustomerChannelController {

    private final CustomerChannelService customerChannelService;

    @GetMapping
    public ApiResponse<List<CustomerChannel>> findAll() {
        return ApiResponse.ok(customerChannelService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<CustomerChannel> findById(@PathVariable Long id) {
        return ApiResponse.ok(customerChannelService.findById(id));
    }

    @PostMapping
    public ApiResponse<CustomerChannel> create(@Valid @RequestBody CustomerChannelDto dto) {
        return ApiResponse.ok("Tao kenh ban hang thanh cong", customerChannelService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<CustomerChannel> update(@PathVariable Long id, @Valid @RequestBody CustomerChannelDto dto) {
        return ApiResponse.ok("Cap nhat kenh ban hang thanh cong", customerChannelService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        customerChannelService.delete(id);
        return ApiResponse.ok("Da xoa kenh ban hang", null);
    }
}
