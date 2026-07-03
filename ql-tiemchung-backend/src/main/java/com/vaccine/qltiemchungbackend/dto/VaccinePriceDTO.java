package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * VaccinePriceDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class VaccinePriceDTO {
    private Long id;
    private String name;
    private String dosage;
    private String year;
    private Double price;
}