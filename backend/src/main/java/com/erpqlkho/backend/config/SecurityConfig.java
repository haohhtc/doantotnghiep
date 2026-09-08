package com.erpqlkho.backend.config;

import com.erpqlkho.backend.auth.security.JwtAuthFilter;
import com.erpqlkho.backend.auth.security.RestAccessDeniedHandler;
import com.erpqlkho.backend.auth.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final RestAccessDeniedHandler restAccessDeniedHandler;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // Phan quyen: chi ADMIN duoc quan tri.
                        .requestMatchers("/api/roles/**").hasRole("ADMIN")

                        // Nguoi dung: xem (GET) mo them cho WAREHOUSE_MANAGER vi trang Kho can doc
                        // /api/users de lay dropdown "Nguoi quan ly kho" khi them/sua kho. Tao/sua/xoa/khoa
                        // tai khoan van CHI ADMIN duoc lam.
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // Nha cung cap & Kho: ai dang nhap cung xem duoc (SalesOrder/GoodsReceipt can
                        // load danh sach de chon), nhung chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa.
                        .requestMatchers(HttpMethod.GET, "/api/suppliers/**", "/api/warehouses/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/suppliers/**", "/api/warehouses/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/suppliers/**", "/api/warehouses/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/suppliers/**", "/api/warehouses/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        // San pham & Danh muc san pham: ai dang nhap cung xem duoc, nhung SALES_STAFF
                        // chi duoc xem (khong them/sua/xoa) - chi ADMIN + WAREHOUSE_MANAGER moi sua duoc.
                        .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/product-categories/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/products/**", "/api/product-categories/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/product-categories/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**", "/api/product-categories/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        // Khach hang: ca 3 role deu duoc toan quyen CRUD.
                        .requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER", "SALES_STAFF")

                        // Nhap hang & Kiem ke kho: ai dang nhap cung xem duoc, nhung SALES_STAFF chi duoc
                        // xem - tao/sua/xoa VA xac nhan/duyet (POST .../confirm, .../approve - van la POST
                        // nen khop chung voi rule POST duoi day) chi ADMIN + WAREHOUSE_MANAGER duoc lam.
                        .requestMatchers(HttpMethod.GET, "/api/goods-receipts/**", "/api/stock-takes/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/goods-receipts/**", "/api/stock-takes/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/goods-receipts/**", "/api/stock-takes/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/goods-receipts/**", "/api/stock-takes/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        // Canh bao ton kho (INV-05): ai dang nhap cung xem duoc, nhung SALES_STAFF chi duoc
                        // xem - tao/sua nguong VA danh dau xu ly (PUT .../resolve - khop chung voi rule PUT)
                        // chi ADMIN + WAREHOUSE_MANAGER duoc lam.
                        .requestMatchers(HttpMethod.GET, "/api/stock-alerts/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/stock-alerts/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/stock-alerts/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        // Tuyen ban hang & Chi nhanh (Branch/SellingZone/RouteMaster/RouteSetting): ai dang
                        // nhap cung xem duoc, chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa - khop dung
                        // pattern "Danh muc" (Product/Warehouse) vi Nhi yeu cau dat nhom nay trong Danh muc.
                        .requestMatchers(HttpMethod.GET,
                                "/api/branches/**", "/api/selling-zones/**",
                                "/api/route-masters/**", "/api/route-settings/**").authenticated()
                        .requestMatchers(HttpMethod.POST,
                                "/api/branches/**", "/api/selling-zones/**",
                                "/api/route-masters/**", "/api/route-settings/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/branches/**", "/api/selling-zones/**",
                                "/api/route-masters/**", "/api/route-settings/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/branches/**", "/api/selling-zones/**",
                                "/api/route-masters/**", "/api/route-settings/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        // Vung dia ly (Region/Province/District/Ward): ai dang nhap cung xem duoc,
                        // chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa - khop dung pattern chung.
                        .requestMatchers(HttpMethod.GET,
                                "/api/regions/**", "/api/provinces/**",
                                "/api/districts/**", "/api/wards/**").authenticated()
                        .requestMatchers(HttpMethod.POST,
                                "/api/regions/**", "/api/provinces/**",
                                "/api/districts/**", "/api/wards/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/regions/**", "/api/provinces/**",
                                "/api/districts/**", "/api/wards/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/regions/**", "/api/provinces/**",
                                "/api/districts/**", "/api/wards/**")
                        .hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
