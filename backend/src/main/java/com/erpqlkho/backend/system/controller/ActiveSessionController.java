package com.erpqlkho.backend.system.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.system.entity.ActiveSession;
import com.erpqlkho.backend.system.service.ActiveSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/system/sessions")
@RequiredArgsConstructor
public class ActiveSessionController {

    private final ActiveSessionService activeSessionService;

    @GetMapping
    public ApiResponse<List<ActiveSession>> findAll() {
        return ApiResponse.ok(activeSessionService.findAll());
    }

    @PostMapping("/{id}/revoke")
    public ApiResponse<ActiveSession> revoke(@PathVariable Long id) {
        return ApiResponse.ok("Da dang xuat tu xa thiet bi nay", activeSessionService.revoke(id));
    }
}
