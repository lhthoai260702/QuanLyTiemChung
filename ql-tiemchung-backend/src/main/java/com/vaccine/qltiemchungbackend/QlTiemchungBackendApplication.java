package com.vaccine.qltiemchungbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Thêm tham số exclude để tắt màn hình đăng nhập mặc định
@SpringBootApplication(exclude = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
})
public class QlTiemchungBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(QlTiemchungBackendApplication.class, args);
    }
}