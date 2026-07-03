package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * LoginRequest
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class LoginRequest {
    private String username;
    private String password;
}