package com.vaccine.qltiemchungbackend.dto;

public interface CustomerVaccineProjection {
    Long getMaVacXin();
    String getTenVacXin();
    String getLoaiVacXin();
    String getPhongNguaBenh();
    String getDoTuoiTiemChung();
    Double getDonGia();
    Long getTonKho();
}