package com.vaccine.qltiemchungbackend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String hoTen;
    private String token; // Access Token
    private Long maQuyen;

    @JsonIgnore // Quan trọng: Không cho phép refresh token lộ ra JSON body
    private String refreshToken;
}