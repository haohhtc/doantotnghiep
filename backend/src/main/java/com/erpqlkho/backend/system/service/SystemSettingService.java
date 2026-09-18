package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.system.dto.SystemSettingDto;
import com.erpqlkho.backend.system.entity.SystemSetting;
import com.erpqlkho.backend.system.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public List<SystemSetting> findAll() {
        return systemSettingRepository.findAll();
    }

    public SystemSetting findById(Long id) {
        return systemSettingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cau hinh id=" + id));
    }

    @Transactional
    public SystemSetting create(SystemSettingDto dto) {
        if (systemSettingRepository.existsBySettingKey(dto.getSettingKey())) {
            throw ApiException.conflict("Khoa cau hinh da ton tai: " + dto.getSettingKey());
        }
        SystemSetting setting = new SystemSetting();
        setting.setSettingKey(dto.getSettingKey());
        setting.setSettingValue(dto.getSettingValue());
        setting.setDescription(dto.getDescription());
        setting.setUpdatedAt(LocalDateTime.now());
        return systemSettingRepository.save(setting);
    }

    @Transactional
    public SystemSetting update(Long id, SystemSettingDto dto) {
        SystemSetting setting = findById(id);
        if (!setting.getSettingKey().equals(dto.getSettingKey()) && systemSettingRepository.existsBySettingKey(dto.getSettingKey())) {
            throw ApiException.conflict("Khoa cau hinh da ton tai: " + dto.getSettingKey());
        }
        setting.setSettingKey(dto.getSettingKey());
        setting.setSettingValue(dto.getSettingValue());
        setting.setDescription(dto.getDescription());
        setting.setUpdatedAt(LocalDateTime.now());
        return systemSettingRepository.save(setting);
    }

    @Transactional
    public void delete(Long id) {
        systemSettingRepository.delete(findById(id));
    }
}
