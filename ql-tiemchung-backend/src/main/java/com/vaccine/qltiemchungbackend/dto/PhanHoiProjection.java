package com.vaccine.qltiemchungbackend.dto;

/**
 * PhanHoiProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface PhanHoiProjection {
    Long getId();

    String getCustomerName();

    String getComments();

    String getEmail();

    String getStatus();

    String getResponseText();

    String getThoiGianTiem();
}