package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

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

    // THÊM CÁC TRƯỜNG TÀI KHOẢN
    private String cmnd;
    private String email;
    private String matKhau;

    private List<LichSuTiemDTO> history = new ArrayList<>();
}