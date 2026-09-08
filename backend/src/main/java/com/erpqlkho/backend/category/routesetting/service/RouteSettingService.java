package com.erpqlkho.backend.category.routesetting.service;

import com.erpqlkho.backend.category.routemaster.entity.RouteMaster;
import com.erpqlkho.backend.category.routemaster.repository.RouteMasterRepository;
import com.erpqlkho.backend.category.routesetting.dto.RouteSettingDto;
import com.erpqlkho.backend.category.routesetting.entity.RouteSetting;
import com.erpqlkho.backend.category.routesetting.repository.RouteSettingRepository;
import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteSettingService {

    private final RouteSettingRepository routeSettingRepository;
    private final RouteMasterRepository routeMasterRepository;
    private final UserRepository userRepository;

    public List<RouteSetting> findAll() {
        return routeSettingRepository.findAll();
    }

    public RouteSetting findById(Long id) {
        return routeSettingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay giao tuyen id=" + id));
    }

    @Transactional
    public RouteSetting create(RouteSettingDto dto) {
        if (routeSettingRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma giao tuyen da ton tai: " + dto.getCode());
        }

        RouteSetting setting = new RouteSetting();
        applyDto(setting, dto);

        return routeSettingRepository.save(setting);
    }

    @Transactional
    public RouteSetting update(Long id, RouteSettingDto dto) {
        RouteSetting setting = findById(id);

        if (!setting.getCode().equals(dto.getCode()) && routeSettingRepository.existsByCode(dto.getCode())) {
            throw ApiException.conflict("Ma giao tuyen da ton tai: " + dto.getCode());
        }

        applyDto(setting, dto);
        return routeSettingRepository.save(setting);
    }

    @Transactional
    public void delete(Long id) {
        RouteSetting setting = findById(id);
        routeSettingRepository.delete(setting);
    }

    private void applyDto(RouteSetting setting, RouteSettingDto dto) {
        setting.setCode(dto.getCode());
        setting.setName(dto.getName());
        setting.setRouteMaster(findRouteMaster(dto.getRouteMasterId()));
        setting.setSalesPerson(findUser(dto.getSalesPersonId(), "Nguoi phu trach"));
        setting.setManageBy(dto.getManageById() != null ? findUser(dto.getManageById(), "Nguoi quan ly") : null);
        setting.setEffectiveDate(dto.getEffectiveDate());
        setting.setEndDate(dto.getEndDate());
    }

    private RouteMaster findRouteMaster(Long id) {
        return routeMasterRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay khung tuyen id=" + id));
    }

    private User findUser(Long id, String label) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay " + label + " id=" + id));
    }
}
