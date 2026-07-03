package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * SupplierTransactionDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class SupplierTransactionDTO {
    private String id;
    private String date;
    private String vaccineCode;
    private Integer quantity;
    private String supplierName;
    private Double price;
}