package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * ProfileController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    /**
     * Tự động nhận diện user đang gọi thông qua token (Authentication)
     *
     * @param authentication
     * @return
     */
    @GetMapping
    public ResponseEntity<ProfileDTO> getProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(profileService.getProfile(username));
    }

    /**
     * Cập nhật profile
     *
     * @param authentication
     * @param dto
     * @return
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody ProfileDTO dto) {
        try {
            String username = authentication.getName();
            profileService.updateProfile(username, dto);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật thông tin cá nhân thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}