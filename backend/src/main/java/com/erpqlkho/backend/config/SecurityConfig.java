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
                        // /ws/**: khong qua JWT (xem WebSocketConfig.java) - kenh chi phat tin hieu
                        // "co gi vua doi, tu tai lai" + ten NVBH, KHONG gui kem du lieu ton kho that
                        // nen chap nhan khong xac thuc, tranh phai tich hop JWT vao STOMP handshake.
                        .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**", "/ws/**", "/ws-native/**").permitAll()

                        // Danh muc quyen (de ve modal "Phan quyen") - ai dang nhap cung doc duoc,
                        // khong lo ro gi (chi la ten+nhan quyen, khong phai du lieu nguoi dung).
                        .requestMatchers(HttpMethod.GET, "/api/permissions/catalog").authenticated()

                        // ===================== HE THONG (7 nhom uu tien - V57, PERM_ chi tiet) =====================
                        // Nguoi dung: GET van mo cho ADMIN+WAREHOUSE_MANAGER nhu cu (WAREHOUSE_MANAGER
                        // khong co system_user:view trong backfill nhung van can doc /api/users de lay
                        // dropdown "Nguoi quan ly kho" - giu rieng 1 dong GET nay, KHONG gop vao PERM
                        // chung, tranh pha vo luong dang dung).
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/users").hasAuthority("PERM_system_user:create")
                        .requestMatchers(HttpMethod.PUT, "/api/users/*/permissions").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/*").hasAuthority("PERM_system_user:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/users/*").hasAuthority("PERM_system_user:delete")

                        .requestMatchers(HttpMethod.GET, "/api/roles/**").hasAuthority("PERM_system_role:view")
                        .requestMatchers(HttpMethod.POST, "/api/roles").hasAuthority("PERM_system_role:create")
                        .requestMatchers(HttpMethod.PUT, "/api/roles/*").hasAuthority("PERM_system_role:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/roles/*").hasAuthority("PERM_system_role:delete")

                        .requestMatchers(HttpMethod.GET, "/api/login-logs/**").hasAuthority("PERM_system_login_log:view")
                        .requestMatchers(HttpMethod.GET, "/api/numbering-configs/**").hasAuthority("PERM_system_numbering_config:view")
                        .requestMatchers(HttpMethod.PUT, "/api/numbering-configs/**").hasAuthority("PERM_system_numbering_config:edit")
                        .requestMatchers(HttpMethod.GET, "/api/system/sessions/**").hasAuthority("PERM_system_active_session:view")
                        .requestMatchers(HttpMethod.POST, "/api/system/sessions/**").hasAuthority("PERM_system_active_session:edit")
                        .requestMatchers(HttpMethod.GET, "/api/approval-configs/**").hasAuthority("PERM_system_approval_config:view")
                        .requestMatchers(HttpMethod.PUT, "/api/approval-configs/**").hasAuthority("PERM_system_approval_config:edit")
                        .requestMatchers(HttpMethod.GET, "/api/email-config/**", "/api/email-logs/**").hasAuthority("PERM_system_email_config:view")
                        .requestMatchers(HttpMethod.PUT, "/api/email-config/**").hasAuthority("PERM_system_email_config:edit")
                        .requestMatchers(HttpMethod.GET, "/api/settings/**").hasAuthority("PERM_system_setting:view")
                        .requestMatchers(HttpMethod.POST, "/api/settings/**").hasAuthority("PERM_system_setting:create")
                        .requestMatchers(HttpMethod.PUT, "/api/settings/**").hasAuthority("PERM_system_setting:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/settings/**").hasAuthority("PERM_system_setting:delete")

                        // ===================== BAN HANG =====================
                        .requestMatchers(HttpMethod.POST, "/api/sales-orders/*/confirm").hasAuthority("PERM_sales_order:confirm")
                        .requestMatchers(HttpMethod.POST, "/api/sales-orders/*/cancel").hasAuthority("PERM_sales_order:cancel")
                        .requestMatchers(HttpMethod.GET, "/api/sales-orders/**").hasAuthority("PERM_sales_order:view")
                        .requestMatchers(HttpMethod.POST, "/api/sales-orders").hasAuthority("PERM_sales_order:create")
                        .requestMatchers(HttpMethod.PUT, "/api/sales-orders/*").hasAuthority("PERM_sales_order:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/sales-orders/*").hasAuthority("PERM_sales_order:delete")

                        .requestMatchers(HttpMethod.POST, "/api/sales-requests/*/convert").hasAuthority("PERM_sales_request:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/sales-requests/**").hasAuthority("PERM_sales_request:view")
                        .requestMatchers(HttpMethod.POST, "/api/sales-requests").hasAuthority("PERM_sales_request:create")
                        .requestMatchers(HttpMethod.PUT, "/api/sales-requests/*").hasAuthority("PERM_sales_request:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/sales-requests/*").hasAuthority("PERM_sales_request:delete")

                        // ===================== GIAO HANG =====================
                        .requestMatchers(HttpMethod.POST, "/api/delivery-orders/*/confirm").hasAuthority("PERM_delivery_order:confirm")
                        .requestMatchers(HttpMethod.POST, "/api/delivery-orders/*/cancel").hasAuthority("PERM_delivery_order:cancel")
                        .requestMatchers(HttpMethod.GET, "/api/delivery-orders/**").hasAuthority("PERM_delivery_order:view")
                        .requestMatchers(HttpMethod.POST, "/api/delivery-orders").hasAuthority("PERM_delivery_order:create")
                        .requestMatchers(HttpMethod.PUT, "/api/delivery-orders/*").hasAuthority("PERM_delivery_order:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/delivery-orders/*").hasAuthority("PERM_delivery_order:delete")

                        // ===================== HOA DON (khong co Sua - hoa don bat bien) =====================
                        .requestMatchers(HttpMethod.POST, "/api/invoices/*/cancel").hasAuthority("PERM_invoice:cancel")
                        .requestMatchers(HttpMethod.GET, "/api/invoices/**").hasAuthority("PERM_invoice:view")
                        .requestMatchers(HttpMethod.POST, "/api/invoices", "/api/invoices/van-sale").hasAuthority("PERM_invoice:create")

                        // ===================== TRA HANG =====================
                        .requestMatchers(HttpMethod.POST, "/api/sales-returns/*/confirm").hasAuthority("PERM_sales_return:confirm")
                        .requestMatchers(HttpMethod.POST, "/api/sales-returns/*/cancel").hasAuthority("PERM_sales_return:cancel")
                        .requestMatchers(HttpMethod.GET, "/api/sales-returns/**").hasAuthority("PERM_sales_return:view")
                        .requestMatchers(HttpMethod.POST, "/api/sales-returns").hasAuthority("PERM_sales_return:create")
                        .requestMatchers(HttpMethod.PUT, "/api/sales-returns/*").hasAuthority("PERM_sales_return:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/sales-returns/*").hasAuthority("PERM_sales_return:delete")

                        .requestMatchers(HttpMethod.POST, "/api/purchase-returns/*/confirm").hasAuthority("PERM_purchase_return:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/purchase-returns/**").hasAuthority("PERM_purchase_return:view")
                        .requestMatchers(HttpMethod.POST, "/api/purchase-returns").hasAuthority("PERM_purchase_return:create")
                        .requestMatchers(HttpMethod.PUT, "/api/purchase-returns/*").hasAuthority("PERM_purchase_return:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/purchase-returns/*").hasAuthority("PERM_purchase_return:delete")

                        // ===================== MUA HANG (Yeu cau mua hang) =====================
                        .requestMatchers(HttpMethod.POST, "/api/purchase-requests/*/submit").hasAuthority("PERM_purchase_request:confirm")
                        .requestMatchers(HttpMethod.POST, "/api/purchase-requests/*/convert-to-goods-receipt").hasAuthority("PERM_purchase_request:convert")
                        .requestMatchers(HttpMethod.GET, "/api/purchase-requests/**").hasAuthority("PERM_purchase_request:view")
                        .requestMatchers(HttpMethod.POST, "/api/purchase-requests").hasAuthority("PERM_purchase_request:create")
                        .requestMatchers(HttpMethod.PUT, "/api/purchase-requests/*").hasAuthority("PERM_purchase_request:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/purchase-requests/*").hasAuthority("PERM_purchase_request:delete")

                        // ===================== KHO =====================
                        .requestMatchers(HttpMethod.POST, "/api/goods-receipts/*/confirm").hasAuthority("PERM_goods_receipt:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/goods-receipts/**").hasAuthority("PERM_goods_receipt:view")
                        .requestMatchers(HttpMethod.POST, "/api/goods-receipts").hasAuthority("PERM_goods_receipt:create")
                        .requestMatchers(HttpMethod.PUT, "/api/goods-receipts/*").hasAuthority("PERM_goods_receipt:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/goods-receipts/*").hasAuthority("PERM_goods_receipt:delete")

                        .requestMatchers(HttpMethod.POST, "/api/goods-issues/*/confirm").hasAuthority("PERM_goods_issue:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/goods-issues/**").hasAuthority("PERM_goods_issue:view")
                        .requestMatchers(HttpMethod.POST, "/api/goods-issues").hasAuthority("PERM_goods_issue:create")
                        .requestMatchers(HttpMethod.PUT, "/api/goods-issues/*").hasAuthority("PERM_goods_issue:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/goods-issues/*").hasAuthority("PERM_goods_issue:delete")

                        // Chi rang buoc rieng endpoint /confirm (nguoi xac nhan tren Web = thu kho) - CHUA dong
                        // GET/POST con lai cua van-sale-advances vi app Van-Sale (NVBH tu tao phieu) dang goi
                        // thang khong qua kiem tra quyen rieng (chi can dang nhap) - xem VanSaleAdvanceController.
                        .requestMatchers(HttpMethod.POST, "/api/van-sale-advances/*/confirm").hasAuthority("PERM_van_sale_advance:confirm")

                        .requestMatchers(HttpMethod.POST, "/api/inventory-transfers/*/confirm-send").hasAuthority("PERM_inventory_transfer:confirm_send")
                        .requestMatchers(HttpMethod.POST, "/api/inventory-transfers/*/confirm-receive").hasAuthority("PERM_inventory_transfer:confirm_receive")
                        .requestMatchers(HttpMethod.GET, "/api/inventory-transfers/**").hasAuthority("PERM_inventory_transfer:view")
                        .requestMatchers(HttpMethod.POST, "/api/inventory-transfers").hasAuthority("PERM_inventory_transfer:create")
                        .requestMatchers(HttpMethod.PUT, "/api/inventory-transfers/*").hasAuthority("PERM_inventory_transfer:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/inventory-transfers/*").hasAuthority("PERM_inventory_transfer:delete")

                        .requestMatchers(HttpMethod.POST, "/api/stock-takes/*/approve").hasAuthority("PERM_stock_take:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/stock-takes/**").hasAuthority("PERM_stock_take:view")
                        .requestMatchers(HttpMethod.POST, "/api/stock-takes").hasAuthority("PERM_stock_take:create")
                        .requestMatchers(HttpMethod.PUT, "/api/stock-takes/*").hasAuthority("PERM_stock_take:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/stock-takes/*").hasAuthority("PERM_stock_take:delete")

                        .requestMatchers(HttpMethod.POST, "/api/stock-receipts/*/confirm").hasAuthority("PERM_stock_receipt:confirm")
                        .requestMatchers(HttpMethod.GET, "/api/stock-receipts/**").hasAuthority("PERM_stock_receipt:view")
                        .requestMatchers(HttpMethod.POST, "/api/stock-receipts").hasAuthority("PERM_stock_receipt:create")
                        .requestMatchers(HttpMethod.PUT, "/api/stock-receipts/*").hasAuthority("PERM_stock_receipt:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/stock-receipts/*").hasAuthority("PERM_stock_receipt:delete")

                        .requestMatchers(HttpMethod.GET, "/api/stock/**").hasAuthority("PERM_stock:view")

                        // ===================== DANH MUC (CRUD don gian, khong co hanh dong rieng) =====================
                        .requestMatchers(HttpMethod.GET, "/api/products/**").hasAuthority("PERM_product:view")
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("PERM_product:create")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("PERM_product:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("PERM_product:delete")

                        .requestMatchers(HttpMethod.GET, "/api/product-categories/**").hasAuthority("PERM_product_category:view")
                        .requestMatchers(HttpMethod.POST, "/api/product-categories/**").hasAuthority("PERM_product_category:create")
                        .requestMatchers(HttpMethod.PUT, "/api/product-categories/**").hasAuthority("PERM_product_category:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/product-categories/**").hasAuthority("PERM_product_category:delete")

                        .requestMatchers(HttpMethod.GET, "/api/product-groups/**").hasAuthority("PERM_product_group:view")
                        .requestMatchers(HttpMethod.POST, "/api/product-groups/**").hasAuthority("PERM_product_group:create")
                        .requestMatchers(HttpMethod.PUT, "/api/product-groups/**").hasAuthority("PERM_product_group:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/product-groups/**").hasAuthority("PERM_product_group:delete")

                        .requestMatchers(HttpMethod.GET, "/api/customers/**").hasAuthority("PERM_customer:view")
                        .requestMatchers(HttpMethod.POST, "/api/customers/**").hasAuthority("PERM_customer:create")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**").hasAuthority("PERM_customer:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasAuthority("PERM_customer:delete")

                        .requestMatchers(HttpMethod.GET, "/api/customer-groups/**").hasAuthority("PERM_customer_group:view")
                        .requestMatchers(HttpMethod.POST, "/api/customer-groups/**").hasAuthority("PERM_customer_group:create")
                        .requestMatchers(HttpMethod.PUT, "/api/customer-groups/**").hasAuthority("PERM_customer_group:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/customer-groups/**").hasAuthority("PERM_customer_group:delete")

                        .requestMatchers(HttpMethod.GET, "/api/customer-channels/**").hasAuthority("PERM_customer_channel:view")
                        .requestMatchers(HttpMethod.POST, "/api/customer-channels/**").hasAuthority("PERM_customer_channel:create")
                        .requestMatchers(HttpMethod.PUT, "/api/customer-channels/**").hasAuthority("PERM_customer_channel:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/customer-channels/**").hasAuthority("PERM_customer_channel:delete")

                        .requestMatchers(HttpMethod.GET, "/api/suppliers/**").hasAuthority("PERM_supplier:view")
                        .requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasAuthority("PERM_supplier:create")
                        .requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasAuthority("PERM_supplier:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasAuthority("PERM_supplier:delete")

                        .requestMatchers(HttpMethod.GET, "/api/warehouses/**").hasAuthority("PERM_warehouse:view")
                        .requestMatchers(HttpMethod.POST, "/api/warehouses/**").hasAuthority("PERM_warehouse:create")
                        .requestMatchers(HttpMethod.PUT, "/api/warehouses/**").hasAuthority("PERM_warehouse:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/warehouses/**").hasAuthority("PERM_warehouse:delete")

                        .requestMatchers(HttpMethod.GET, "/api/branches/**").hasAuthority("PERM_branch:view")
                        .requestMatchers(HttpMethod.POST, "/api/branches/**").hasAuthority("PERM_branch:create")
                        .requestMatchers(HttpMethod.PUT, "/api/branches/**").hasAuthority("PERM_branch:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/branches/**").hasAuthority("PERM_branch:delete")

                        .requestMatchers(HttpMethod.GET, "/api/selling-zones/**").hasAuthority("PERM_selling_zone:view")
                        .requestMatchers(HttpMethod.POST, "/api/selling-zones/**").hasAuthority("PERM_selling_zone:create")
                        .requestMatchers(HttpMethod.PUT, "/api/selling-zones/**").hasAuthority("PERM_selling_zone:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/selling-zones/**").hasAuthority("PERM_selling_zone:delete")

                        .requestMatchers(HttpMethod.GET, "/api/route-masters/**").hasAuthority("PERM_route_master:view")
                        .requestMatchers(HttpMethod.POST, "/api/route-masters/**").hasAuthority("PERM_route_master:create")
                        .requestMatchers(HttpMethod.PUT, "/api/route-masters/**").hasAuthority("PERM_route_master:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/route-masters/**").hasAuthority("PERM_route_master:delete")

                        .requestMatchers(HttpMethod.GET, "/api/regions/**").hasAuthority("PERM_region:view")
                        .requestMatchers(HttpMethod.POST, "/api/regions/**").hasAuthority("PERM_region:create")
                        .requestMatchers(HttpMethod.PUT, "/api/regions/**").hasAuthority("PERM_region:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/**").hasAuthority("PERM_region:delete")

                        .requestMatchers(HttpMethod.GET, "/api/provinces/**").hasAuthority("PERM_province:view")
                        .requestMatchers(HttpMethod.POST, "/api/provinces/**").hasAuthority("PERM_province:create")
                        .requestMatchers(HttpMethod.PUT, "/api/provinces/**").hasAuthority("PERM_province:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/provinces/**").hasAuthority("PERM_province:delete")

                        .requestMatchers(HttpMethod.GET, "/api/districts/**").hasAuthority("PERM_district:view")
                        .requestMatchers(HttpMethod.POST, "/api/districts/**").hasAuthority("PERM_district:create")
                        .requestMatchers(HttpMethod.PUT, "/api/districts/**").hasAuthority("PERM_district:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/districts/**").hasAuthority("PERM_district:delete")

                        .requestMatchers(HttpMethod.GET, "/api/wards/**").hasAuthority("PERM_ward:view")
                        .requestMatchers(HttpMethod.POST, "/api/wards/**").hasAuthority("PERM_ward:create")
                        .requestMatchers(HttpMethod.PUT, "/api/wards/**").hasAuthority("PERM_ward:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/wards/**").hasAuthority("PERM_ward:delete")

                        .requestMatchers(HttpMethod.GET, "/api/uoms/**").hasAuthority("PERM_uom:view")
                        .requestMatchers(HttpMethod.POST, "/api/uoms/**").hasAuthority("PERM_uom:create")
                        .requestMatchers(HttpMethod.PUT, "/api/uoms/**").hasAuthority("PERM_uom:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/uoms/**").hasAuthority("PERM_uom:delete")

                        .requestMatchers(HttpMethod.GET, "/api/uom-groups/**").hasAuthority("PERM_uom_group:view")
                        .requestMatchers(HttpMethod.POST, "/api/uom-groups/**").hasAuthority("PERM_uom_group:create")
                        .requestMatchers(HttpMethod.PUT, "/api/uom-groups/**").hasAuthority("PERM_uom_group:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/uom-groups/**").hasAuthority("PERM_uom_group:delete")

                        .requestMatchers(HttpMethod.GET, "/api/tax-groups/**").hasAuthority("PERM_tax_group:view")
                        .requestMatchers(HttpMethod.POST, "/api/tax-groups/**").hasAuthority("PERM_tax_group:create")
                        .requestMatchers(HttpMethod.PUT, "/api/tax-groups/**").hasAuthority("PERM_tax_group:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/tax-groups/**").hasAuthority("PERM_tax_group:delete")

                        .requestMatchers(HttpMethod.GET, "/api/price-lists/**").hasAuthority("PERM_price_list:view")
                        .requestMatchers(HttpMethod.POST, "/api/price-lists/**").hasAuthority("PERM_price_list:create")
                        .requestMatchers(HttpMethod.PUT, "/api/price-lists/**").hasAuthority("PERM_price_list:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/price-lists/**").hasAuthority("PERM_price_list:delete")

                        .requestMatchers(HttpMethod.GET, "/api/employees/**").hasAuthority("PERM_employee:view")
                        .requestMatchers(HttpMethod.POST, "/api/employees/**").hasAuthority("PERM_employee:create")
                        .requestMatchers(HttpMethod.PUT, "/api/employees/**").hasAuthority("PERM_employee:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/employees/**").hasAuthority("PERM_employee:delete")

                        .requestMatchers(HttpMethod.GET, "/api/employee-positions/**").hasAuthority("PERM_employee_position:view")
                        .requestMatchers(HttpMethod.POST, "/api/employee-positions/**").hasAuthority("PERM_employee_position:create")
                        .requestMatchers(HttpMethod.PUT, "/api/employee-positions/**").hasAuthority("PERM_employee_position:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/employee-positions/**").hasAuthority("PERM_employee_position:delete")

                        .requestMatchers(HttpMethod.GET, "/api/salesman-types/**").hasAuthority("PERM_salesman_type:view")
                        .requestMatchers(HttpMethod.POST, "/api/salesman-types/**").hasAuthority("PERM_salesman_type:create")
                        .requestMatchers(HttpMethod.PUT, "/api/salesman-types/**").hasAuthority("PERM_salesman_type:edit")
                        .requestMatchers(HttpMethod.DELETE, "/api/salesman-types/**").hasAuthority("PERM_salesman_type:delete")

                        .requestMatchers(HttpMethod.GET, "/api/company").hasAuthority("PERM_company:view")
                        .requestMatchers(HttpMethod.PUT, "/api/company").hasAuthority("PERM_company:edit")

                        // ===================== NGOAI PHAM VI 7 NHOM UU TIEN - GIU NGUYEN NHU CU =====================
                        // Canh bao ton kho (INV-05): khong thuoc 7 nhom uu tien dot nay, giu nguyen Role cu.
                        .requestMatchers(HttpMethod.GET, "/api/stock-alerts/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/stock-alerts/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/stock-alerts/**").hasAnyRole("ADMIN", "WAREHOUSE_MANAGER")

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
