package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.BookingRequestDTO;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LichTiemChungRepository;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * CustomerService
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Service
public class CustomerService {

    @Autowired
    private BenhNhanRepository benhNhanRepository;
    @Autowired
    private LoVacXinRepository loVacXinRepository;
    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Autowired
    private LichTiemChungRepository lichTiemChungRepository;

    /**
     * Đăng ký lịch tiêm chủng cho khách hàng (Bệnh nhân).
     * Tự động kiểm tra tồn kho và lấy lô vắc-xin phù hợp cho đăng ký trung tâm hoặc đăng ký tự do.
     *
     * @param request Thông tin yêu cầu đăng ký tiêm chủng
     */
    @Transactional
    public void bookVaccine(BookingRequestDTO request) {
        // 1. Lấy thông tin Bệnh nhân
        BenhNhan bn = benhNhanRepository.findById(request.getMaBenhNhan())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ bệnh nhân!"));

        ChiTietDkTiem dk = new ChiTietDkTiem();
        dk.setBenhNhan(bn);
        dk.setFlagDelete(false);
        dk.setTrangThai("Chưa tiêm");

        // Phân nhánh logic: Đăng ký theo Lịch trung tâm hoặc Đăng ký trực tiếp vắc xin
        if (request.getMaLichTiem() != null) {
            // Lấy thông tin lịch tiêm trung tâm
            com.vaccine.qltiemchungbackend.entity.LichTiemChung ltc = lichTiemChungRepository.findById(request.getMaLichTiem())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm chủng trung tâm!"));

            if (ltc.getMaLoaiVacXin() == null) {
                throw new RuntimeException("Lịch tiêm chủng này hiện chưa được phân bổ loại vắc-xin!");
            }

            // Tìm lô vắc-xin còn hàng
            LoVacXin loVacXin = loVacXinRepository.findAvailableLotByLoaiVacXinId(ltc.getMaLoaiVacXin())
                    .orElseThrow(() -> new RuntimeException("Rất tiếc, vắc-xin cho lịch tiêm này hiện đã hết hàng trong kho!"));

            dk.setMaLo(loVacXin.getMaLo());
            dk.setThoiGianCanTiem(ltc.getNgayTiem() != null ? ltc.getNgayTiem() : request.getNgayMongMuon());
            dk.setGioTiem(ltc.getThoiGianChung());

            // LƯU TRỰC TIẾP MÃ LỊCH TIÊM VÀO DATABASE
            dk.setMaLichTiem(ltc.getMaLichTiem());

        } else {
            // Đăng ký trực tiếp từ tab thông tin vắc-xin
            LoVacXin loVacXin = loVacXinRepository.findAvailableLotByVaccineId(request.getMaVacXin())
                    .orElseThrow(() -> new RuntimeException("Rất tiếc, vắc-xin này hiện đã hết hàng trong kho!"));

            dk.setMaLo(loVacXin.getMaLo());
            dk.setThoiGianCanTiem(request.getNgayMongMuon());
            dk.setGioTiem(request.getGioMongMuon());
            // Đăng ký tự do thì không có mã lịch tiêm (sẽ Null và lấy địa điểm mặc định là Trụ sở chính)
        }

        chiTietDkTiemRepository.save(dk);
    }
}