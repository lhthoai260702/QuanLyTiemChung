package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * BookingRequestDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class BookingRequestDTO {
    private Long maBenhNhan;
    private Long maVacXin;
    private Long maLichTiem;
    private LocalDate ngayMongMuon;
    private String gioMongMuon;
}