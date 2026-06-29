package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class BookingRequestDTO {
    private Long maBenhNhan;
    private Long maVacXin;
    private Long maLichTiem;
    private LocalDate ngayMongMuon;
}