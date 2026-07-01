package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class VaccinePriceDTO {
    private Long id;
    private String name;
    private String dosage;
    private String year;
    private Double price;
}