package com.erpqlkho.backend.system.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.system.dto.ApprovalConfigDto;
import com.erpqlkho.backend.system.entity.ApprovalConfig;
import com.erpqlkho.backend.system.repository.ApprovalConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApprovalConfigService {

    private final ApprovalConfigRepository approvalConfigRepository;

    public List<ApprovalConfig> findAll() {
        return approvalConfigRepository.findAll();
    }

    public ApprovalConfig findById(Long id) {
        return approvalConfigRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cau hinh duyet id=" + id));
    }

    @Transactional
    public ApprovalConfig create(ApprovalConfigDto dto) {
        if (approvalConfigRepository.existsByDocType(dto.getDocType())) {
            throw ApiException.conflict("Loai chung tu da co cau hinh: " + dto.getDocType());
        }
        ApprovalConfig config = new ApprovalConfig();
        applyDto(config, dto);
        return approvalConfigRepository.save(config);
    }

    @Transactional
    public ApprovalConfig update(Long id, ApprovalConfigDto dto) {
        ApprovalConfig config = findById(id);
        if (!config.getDocType().equals(dto.getDocType()) && approvalConfigRepository.existsByDocType(dto.getDocType())) {
            throw ApiException.conflict("Loai chung tu da co cau hinh: " + dto.getDocType());
        }
        applyDto(config, dto);
        return approvalConfigRepository.save(config);
    }

    @Transactional
    public void delete(Long id) {
        approvalConfigRepository.delete(findById(id));
    }

    private void applyDto(ApprovalConfig config, ApprovalConfigDto dto) {
        config.setDocType(dto.getDocType());
        config.setRequireApproval(dto.getRequireApproval() != null && dto.getRequireApproval());
        config.setApproverRole(dto.getApproverRole());
        config.setUpdatedAt(LocalDateTime.now());
    }
}
