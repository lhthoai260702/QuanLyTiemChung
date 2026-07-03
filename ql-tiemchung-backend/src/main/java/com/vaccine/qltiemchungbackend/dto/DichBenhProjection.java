package com.vaccine.qltiemchungbackend.dto;

/**
 * DichBenhProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface DichBenhProjection {
    Long getId();

    String getThoiDiemKhaoSat();

    String getDiaChi();

    String getTenDichBenh();

    Integer getSoNguoiNhiem();

    String getDuongLayNhiem();

    String getTacHai();

    String getVacXinPhong();

    String getGhiChu();
}