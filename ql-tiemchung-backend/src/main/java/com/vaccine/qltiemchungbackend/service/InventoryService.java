package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private LoVacXinRepository loVacXinRepository;

    @Autowired
    private VacXinRepository vacXinRepository;

    @Autowired
    private LoaiVacXinRepository loaiVacXinRepository;

    public List<KhoVacXinDTO> getAllKhoVacXin() {
        return loVacXinRepository.findAllKhoVacXin();
    }

    @Transactional
    public KhoVacXinDTO saveOrUpdateKhoVacXin(KhoVacXinDTO dto) {
        // 1. Xử lý bảng LOAIVACXIN: Tìm xem đã có chưa, chưa có thì tạo mới
        LoaiVacXin loaiVacXin = loaiVacXinRepository.findByTenLoaiVacXin(dto.getLoaiVacXin())
                .orElseGet(() -> {
                    LoaiVacXin newLoai = new LoaiVacXin();
                    newLoai.setTenLoaiVacXin(dto.getLoaiVacXin());
                    newLoai.setFlagDelete(false);
                    return loaiVacXinRepository.save(newLoai);
                });

        // 2. Xử lý bảng VACXIN: Tìm xem đã có chưa, cập nhật thông tin
        VacXin vacXin = vacXinRepository.findByTenVacXin(dto.getTenVacXin())
                .orElseGet(VacXin::new);

        vacXin.setTenVacXin(dto.getTenVacXin());
        vacXin.setLoaiVacXin(loaiVacXin); // Gắn khóa ngoại
        vacXin.setHamLuong(dto.getHamLuong());
        vacXin.setHanSuDung(dto.getHanSuDung());
        vacXin.setDieuKienBaoQuan(dto.getDieuKienBaoQuan());
        vacXin.setDoTuoiTiemChung(dto.getDoTuoiTiemChung());
        vacXin.setFlagDelete(false);
        vacXin = vacXinRepository.save(vacXin);

        // 3. Xử lý bảng LOVACXIN: Thêm lô mới hoặc cập nhật lô hiện tại
        LoVacXin loVacXin;
        if (dto.getSoLo() != null) {
            // Trường hợp Edit (Chỉnh sửa)
            loVacXin = loVacXinRepository.findById(dto.getSoLo())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô Vắc-xin số: " + dto.getSoLo()));
        } else {
            // Trường hợp Import (Thêm mới)
            loVacXin = new LoVacXin();
        }

        loVacXin.setVacXin(vacXin); // Gắn khóa ngoại
        loVacXin.setNgayNhan(dto.getNgayNhan());
        loVacXin.setGiayPhep(dto.getGiayPhep());
        loVacXin.setNuocSanXuat(dto.getNuocSanXuat());
        loVacXin.setSoLuong(dto.getSoLuong());
        loVacXin.setTinhTrang(dto.getTinhTrang());
        loVacXin.setFlagDelete(false);

        loVacXin = loVacXinRepository.save(loVacXin);

        // Cập nhật lại Số Lô (ID) vừa được Database generate cho DTO để trả về Frontend
        dto.setSoLo(loVacXin.getMaLo());

        return dto;
    }

    public List<LoaiVacXin> getAllLoaiVacXin() {
        return loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull();
    }

    @Transactional
    public void exportVaccine(Long soLo, int soLuongXuat) {
        LoVacXin loVacXin = loVacXinRepository.findById(soLo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô Vắc-xin số: " + soLo));

        if (loVacXin.getSoLuong() < soLuongXuat) {
            throw new RuntimeException("Số lượng xuất vượt quá tồn kho!");
        }

        loVacXin.setSoLuong(loVacXin.getSoLuong() - soLuongXuat);
        loVacXinRepository.save(loVacXin);
    }

    // Xử lý Xóa Mềm (Soft Delete)
    @Transactional
    public void deleteKhoVacXin(Long soLo) {
        LoVacXin loVacXin = loVacXinRepository.findById(soLo)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Lô Vắc-xin số: " + soLo));

        loVacXin.setFlagDelete(true); // Xóa mềm: Không mất dữ liệu, chỉ ẩn đi
        loVacXinRepository.save(loVacXin);
    }
}