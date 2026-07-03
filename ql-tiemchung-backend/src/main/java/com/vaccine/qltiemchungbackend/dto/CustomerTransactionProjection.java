package com.vaccine.qltiemchungbackend.dto;

/**
 * CustomerTransactionProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface CustomerTransactionProjection {
    String getId();

    String getDate();

    String getVaccineCode();

    Integer getQuantity();

    String getCustomerName();

    Double getPrice();
}