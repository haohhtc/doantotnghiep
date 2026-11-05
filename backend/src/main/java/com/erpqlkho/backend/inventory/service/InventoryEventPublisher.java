package com.erpqlkho.backend.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

// Phat tin hieu realtime cho Web ERP (xem config/WebSocketConfig.java) - CHI phat loai su kien +
// ten NVBH, KHONG phat so lieu ton kho that (Frontend tu goi lai REST API co JWT de lay so that).
@Service
@RequiredArgsConstructor
public class InventoryEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(String eventType, String employeeName) {
        messagingTemplate.convertAndSend("/topic/inventory", Map.of(
                "eventType", eventType,
                "employeeName", employeeName == null ? "" : employeeName));
    }
}
