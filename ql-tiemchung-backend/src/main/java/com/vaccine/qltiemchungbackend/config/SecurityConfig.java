package com.vaccine.qltiemchungbackend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * SecurityConfig
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    /**
     * Khởi tạo đối tượng mã hóa mật khẩu sử dụng thuật toán BCrypt
     *
     * @return PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Khởi tạo Bean quản lý xác thực (AuthenticationManager) để gọi xử lý đăng nhập trong AuthController
     *
     * @param config
     * @return AuthenticationManager
     * @throws Exception
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Thiết lập chuỗi bộ lọc bảo mật (Security Filter Chain) cho các luồng HTTP
     *
     * @param http
     * @return SecurityFilterChain
     * @throws Exception
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable()) // Stateless JWT không cần CSRF
                .authorizeHttpRequests(auth -> auth
                        // Cho phép truy cập tự do vào API Đăng nhập / Đăng ký
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()

                        // Mở thêm các endpoints public nếu cần (VD: Swagger, ảnh, v.v...)
                        // .requestMatchers("/v3/api-docs/**", "/swagger-ui/**").permitAll()

                        // TẤT CẢ các API còn lại đều phải có JWT Token mới được vào
                        .anyRequest().authenticated()
                )
                // Cấu hình không lưu session (Stateless)
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Chèn cái phễu lọc JWT của mình vào TRƯỚC lớp lọc mật khẩu mặc định của Spring
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cấu hình chính sách CORS để cho phép các domain client gọi API
     *
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Đã thêm link Vercel vào danh sách cho phép (bên cạnh localhost)
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "https://quan-ly-tiem-chung.vercel.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}