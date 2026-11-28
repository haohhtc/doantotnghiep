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
        // Endpoint rieng KHONG qua SockJS (native WebSocket thuan) danh cho App Van-Sale (React
        // Native) - thu vien sockjs-client phu thuoc API cua trinh duyet (document, XHR...) nen
        // khong dung duoc trong RN, trong khi @stomp/stompjs noi thang qua WebSocket goc (co san
        // trong RN) thi dung binh thuong. Cung 1 broker "/topic" - Web va App nhan chung tin hieu.
        registry.addEndpoint("/ws-native").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }
}
