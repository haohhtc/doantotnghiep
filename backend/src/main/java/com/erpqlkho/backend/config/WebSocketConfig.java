package com.erpqlkho.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// Realtime cho Web ERP (yeu cau giang vien, xem dalam.md "Realtime"): App Van-Sale tao giao dich
// (Ung/Tra hang, hoa don Van Sale) xong thi phat tin hieu qua day, trang Ton kho dang mo tu lam
// moi + hien thong bao - KHONG gui kem so lieu ton kho that (van goi lai REST API co JWT nhu cu),
// nen endpoint /ws khong can xac thuc (xem SecurityConfig, InventoryEventPublisher).
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }
}
