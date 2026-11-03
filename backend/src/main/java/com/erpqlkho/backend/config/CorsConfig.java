package com.erpqlkho.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // setAllowedOriginPatterns (khong phai setAllowedOrigins) de ho tro duoc dau * trong tung
        // muc (vd http://192.168.*.*:*) cung luc voi allowCredentials(true) - Spring chan
        // setAllowedOrigins("*") + credentials, nhung cho phep pattern. Nho vay khi doi mang
        // Wi-Fi (nha/truong...) IP LAN doi lien tuc van tu khop dung, khong can sua
        // CORS_ALLOWED_ORIGINS + restart backend moi lan - xem application.yml.
        config.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        // Mac dinh Spring cache ket qua preflight 1800s (30 phut) o trinh duyet - khi dev hay doi
        // CORS_ALLOWED_ORIGINS (them port Expo web...) ma khong restart trinh duyet thi de bi dinh
        // ket qua cu. Rut xuong 60s cho du dung nhung khong gay bat ngo luc dev.
        config.setMaxAge(60L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
