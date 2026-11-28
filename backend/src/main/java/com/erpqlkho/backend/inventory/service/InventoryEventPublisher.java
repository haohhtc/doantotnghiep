package com.erpqlkho.backend.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

// Phat tin hieu realtime cho CA Web ERP (qua /ws, SockJS) LAN App Van-Sale (qua /ws-native, native
// WebSocket - xem config/WebSocketConfig.java), CUNG 1 broker "/topic/inventory" - CHI phat loai su
// kien + ten/id NVBH + chi nhanh + so phieu, KHONG phat so lieu ton kho that (ben nhan tu goi lai
// REST API co JWT de lay so that). branchId de Web loc theo Chi nhanh dang chon o Header; employeeId
// de App loc "co phai chuyen cua minh khong" (vd ADVANCE_CONFIRMED - bao rieng dung NVBH co phieu
// vua duoc duyet, khong lam phien NVBH khac).
@Service
@RequiredArgsConstructor
public class InventoryEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(String eventType, String employeeName, Long branchId, Long employeeId, String docNumber) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", eventType);
        payload.put("employeeName", employeeName == null ? "" : employeeName);
        payload.put("branchId", branchId);
        payload.put("employeeId", employeeId);
        payload.put("docNumber", docNumber);
        messagingTemplate.convertAndSend("/topic/inventory", payload);
    }
}
