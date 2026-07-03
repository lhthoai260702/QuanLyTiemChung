package com.vaccine.qltiemchungbackend.dto;

/**
 * CustomerVaccineProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface CustomerVaccineProjection {
    Long getMaVacXin();

    String getTenVacXin();

    String getLoaiVacXin();

    String getPhongNguaBenh();

    String getDoTuoiTiemChung();

    Double getDonGia();

    Long getTonKho();
}