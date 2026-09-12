package com.erpqlkho.backend.category.customerchannel.repository;

import com.erpqlkho.backend.category.customerchannel.entity.CustomerChannel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerChannelRepository extends JpaRepository<CustomerChannel, Long> {
    boolean existsByCode(String code);
}
