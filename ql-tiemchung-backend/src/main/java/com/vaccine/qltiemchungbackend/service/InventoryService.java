package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.*;
import com.vaccine.qltiemchungbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    @Autowired private LoVacXinRepository loVacXinRepository;
    @Autowired private VacXinRepository vacXinRepository;
    @Autowired private LoaiVacXinRepository loaiVacXinRepository;
    @Autowired private NhaCungCapRepository nhaCungCapRepository;
    @Autowired private HoaDonRepository hoaDonRepository;

    public List<KhoVacXinDTO> getAllKhoVacXin() {
        return loVacXinRepository.findAllKhoVacXin();
    }

    public List<LoaiVacXin> getAllLoaiVacXin() {
        return loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull();
    }

    @Transactional
    public KhoVacXinDTO saveOrUpdateKhoVacXin(KhoVacXinDTO dto) {

        // 1. XỬ LÝ VẮC XIN (Tạo mới hoặc Sửa thông tin loại có sẵn)
        VacXin vacXin;
        if (dto.getMaVacXin() != null && dto.getMaVacXin() > 0) {
            vacXin = vacXinRepository.findById(dto.getMaVacXin())
                    .orElseThrow(() -> new RuntimeException("Vắc xin không tồn tại"));
            // LƯU LẠI CHỈNH SỬA TỪ FORM FE VÀO DB
            vacXin.setTenVacXin(dto.getTenVacXin());
            vacXin.setHamLuong(dto.getHamLuong());
            vacXin.setHanSuDung(dto.getHanSuDung());
            vacXin.setDieuKienBaoQuan(dto.getDieuKienBaoQuan());
            vacXin.setDoTuoiTiemChung(dto.getDoTuoiTiemChung());
            vacXin.setDonGia(dto.getDonGia());

            if (dto.getLoaiVacXin() != null && !dto.getLoaiVacXin().isEmpty()) {
                LoaiVacXin loaiVacXin = loaiVacXinRepository.findByTenLoaiVacXin(dto.getLoaiVacXin())
                        .orElseGet(() -> {
                            LoaiVacXin newLoai = new LoaiVacXin();
                            newLoai.setTenLoaiVacXin(dto.getLoaiVacXin());
                            newLoai.setFlagDelete(false);
                            return loaiVacXinRepository.save(newLoai);
                        });
                vacXin.setLoaiVacXin(loaiVacXin);
            }
            vacXin = vacXinRepository.save(vacXin);
        } else {
            LoaiVacXin loaiVacXin = loaiVacXinRepository.findByTenLoaiVacXin(dto.getLoaiVacXin())
                    .orElseGet(() -> {
                        LoaiVacXin newLoai = new LoaiVacXin();
                        newLoai.setTenLoaiVacXin(dto.getLoaiVacXin());
                        newLoai.setFlagDelete(false);
                        return loaiVacXinRepository.save(newLoai);
                    });

            vacXin = new VacXin();
            vacXin.setTenVacXin(dto.getTenVacXin());
            vacXin.setLoaiVacXin(loaiVacXin);
            vacXin.setHamLuong(dto.getHamLuong());
            vacXin.setHanSuDung(dto.getHanSuDung());
            vacXin.setDieuKienBaoQuan(dto.getDieuKienBaoQuan());
            vacXin.setDoTuoiTiemChung(dto.getDoTuoiTiemChung());
            vacXin.setDonGia(dto.getDonGia());
            vacXin.setFlagDelete(false);
            vacXin = vacXinRepository.save(vacXin);
        }

        // 2. XỬ LÝ NHÀ CUNG CẤP (Tạo mới hoặc Sửa thông tin cũ)
        NhaCungCap nhaCungCap;
        if (dto.getMaNhaCungCap() != null && dto.getMaNhaCungCap() > 0) {
            nhaCungCap = nhaCungCapRepository.findById(dto.getMaNhaCungCap())
                    .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));
            // LƯU LẠI CHỈNH SỬA TỪ FORM FE VÀO DB
            nhaCungCap.setTenNhaCungCap(dto.getTenNhaCungCap());
            nhaCungCap = nhaCungCapRepository.save(nhaCungCap);
        } else {
            nhaCungCap = new NhaCungCap();
            nhaCungCap.setTenNhaCungCap(dto.getTenNhaCungCap());
            nhaCungCap.setFlagDelete(false);
            nhaCungCap = nhaCungCapRepository.save(nhaCungCap);
        }

        // 3. XỬ LÝ HÓA ĐƠN
        HoaDon hoaDon = null;
        LoVacXin loVacXin;
        if (dto.getSoLo() != null) {
            loVacXin = loVacXinRepository.findById(dto.getSoLo())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô: " + dto.getSoLo()));
            if (loVacXin.getMaHoaDon() != null) {
                hoaDon = hoaDonRepository.findById(loVacXin.getMaHoaDon()).orElse(null);
            }
        } else {
            loVacXin = new LoVacXin();
        }

        if (hoaDon == null) {
            hoaDon = new HoaDon();
            hoaDon.setFlagDelete(false);
        }
        hoaDon.setTongTien(dto.getTongTien() != null ? dto.getTongTien() : 0.0);
        hoaDon = hoaDonRepository.save(hoaDon);

        // 4. LƯU LẠI VÀO BẢNG CHÍNH (LÔ VẮC XIN)
        loVacXin.setVacXin(vacXin);
        loVacXin.setMaNhaCungCap(nhaCungCap.getMaNhaCungCap());
        loVacXin.setMaHoaDon(hoaDon.getMaHoaDon());

        loVacXin.setNgayNhan(dto.getNgayNhan());
        loVacXin.setGiayPhep(dto.getGiayPhep());
        loVacXin.setNuocSanXuat(dto.getNuocSanXuat());
        loVacXin.setSoLuong(dto.getSoLuong());
        loVacXin.setTinhTrang(dto.getTinhTrang());
        loVacXin.setFlagDelete(false);

        loVacXin = loVacXinRepository.save(loVacXin);
        dto.setSoLo(loVacXin.getMaLo());

        return dto;
    }

    @Transactional
    public void exportVaccine(Long soLo, int soLuongXuat) {
        LoVacXin loVacXin = loVacXinRepository.findById(soLo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô Vắc-xin số: " + soLo));
        if (loVacXin.getSoLuong() < soLuongXuat) throw new RuntimeException("Số lượng xuất vượt quá tồn kho!");
        loVacXin.setSoLuong(loVacXin.getSoLuong() - soLuongXuat);
        loVacXinRepository.save(loVacXin);
    }

    @Transactional
    public void deleteKhoVacXin(Long soLo) {
        LoVacXin loVacXin = loVacXinRepository.findById(soLo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô Vắc-xin số: " + soLo));
        loVacXin.setFlagDelete(true);
        loVacXinRepository.save(loVacXin);
    }
}