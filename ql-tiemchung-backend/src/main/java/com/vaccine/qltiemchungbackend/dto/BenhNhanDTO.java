package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * BenhNhanDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class BenhNhanDTO {
    private String id;
    private String fullName;
    private String dob;
    private String gender;
    private Integer age;
    private String address;
    private String guardianName;
    private String phone;

    private List<LichSuTiemDTO> history = new ArrayList<>();
}