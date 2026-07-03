package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.AccountDTO;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaiKhoanService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<AccountDTO> getAllAccounts() {
        // Lấy danh sách từ Native Query đã có sẵn dữ liệu Join
        return taiKhoanRepository.findAllAccountsWithRoles()
                .stream().map(tk -> {
                    AccountDTO dto = new AccountDTO();
                    dto.setMaTaiKhoan(tk.getMaTaiKhoan());
                    dto.setTenDangNhap(tk.getTenDangNhap());
                    dto.setHoTen(tk.getHoTen());
                    dto.setCmnd(tk.getCmnd());
                    dto.setNoiO(tk.getNoiO());
                    dto.setMoTa(tk.getMoTa());
                    dto.setEmail(tk.getEmail());
                    dto.setFlagDelete(tk.getFlagDelete());
                    dto.setPhanQuyen(tk.getPhanQuyen());

                    // --- BỔ SUNG ĐOẠN GẮN DỮ LIỆU NÀY ---
                    dto.setMaQuyen(tk.getMaQuyen());
                    dto.setNamSinh(tk.getNamSinh());
                    dto.setSdt(tk.getSdt());
                    dto.setNgaySinh(tk.getNgaySinh());
                    dto.setDiaChi(tk.getDiaChi());
                    dto.setNguoiGiamHo(tk.getNguoiGiamHo());
                    dto.setGioiTinh(tk.getGioiTinh());

                    return dto;
                }).collect(Collectors.toList());
    }

    // Hàm Tạo Mới đã nâng cấp (Tích hợp Mã hoá mật khẩu BCrypt)
    @Transactional
    public void createAccount(AccountCreationDTO dto) {
        TaiKhoan tk = new TaiKhoan();
        tk.setTenDangNhap(dto.getTenDangNhap());

        // MÃ HOÁ MẬT KHẨU TRƯỚC KHI LƯU VÀO DB
        tk.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));

        tk.setHoTen(dto.getHoTen());
        tk.setCmnd(dto.getCmnd());
        tk.setNoiO(dto.getNoiO());
        tk.setMoTa(dto.getMoTa());
        tk.setEmail(dto.getEmail());
        tk.setFlagDelete(false);

        tk = taiKhoanRepository.save(tk);
        Long maTK = tk.getMaTaiKhoan();

        taiKhoanRepository.insertChiTietPhanQuyen(maTK, dto.getMaQuyen());

        if (dto.getMaQuyen() != null && dto.getMaQuyen() == 6L) {
            taiKhoanRepository.insertBenhNhan(maTK, dto.getHoTen(), dto.getNgaySinh(), dto.getDiaChi(), dto.getNguoiGiamHo(), dto.getSdt(), dto.getGioiTinh());
        } else {
            taiKhoanRepository.insertNhanVien(maTK, dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
        }
    }

    // Hàm Update mới (Tích hợp kiểm tra và Mã hoá mật khẩu BCrypt nếu có đổi)
    @Transactional
    public void updateAccount(Long id, AccountCreationDTO dto) {
        TaiKhoan tk = taiKhoanRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        tk.setHoTen(dto.getHoTen());
        tk.setCmnd(dto.getCmnd());
        tk.setNoiO(dto.getNoiO());
        tk.setMoTa(dto.getMoTa());
        tk.setEmail(dto.getEmail());

        // NẾU FRONTEND TRUYỀN MẬT KHẨU MỚI THÌ SẼ MÃ HOÁ LẠI
        if (dto.getMatKhau() != null && !dto.getMatKhau().trim().isEmpty()) {
            tk.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));
        }

        taiKhoanRepository.save(tk);

        taiKhoanRepository.updateChiTietPhanQuyen(id, dto.getMaQuyen());

        // Kiểm tra nếu Update trả về 0 (nghĩa là user chưa có trong bảng con), thì Insert vào
        if (dto.getMaQuyen() == 6L) {
            int rows = taiKhoanRepository.updateBenhNhan(id, dto.getHoTen(), dto.getNgaySinh(), dto.getDiaChi(), dto.getNguoiGiamHo(), dto.getSdt(), dto.getGioiTinh());
            if (rows == 0)
                taiKhoanRepository.insertBenhNhan(id, dto.getHoTen(), dto.getNgaySinh(), dto.getDiaChi(), dto.getNguoiGiamHo(), dto.getSdt(), dto.getGioiTinh());
        } else {
            int rows = taiKhoanRepository.updateNhanVien(id, dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
            if (rows == 0)
                taiKhoanRepository.insertNhanVien(id, dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
        }
    }

    @Transactional
    public void deleteAccount(Long id) {
        if (!taiKhoanRepository.existsById(id)) {
            throw new RuntimeException("Tài khoản không tồn tại trên hệ thống!");
        }
        taiKhoanRepository.softDeleteAccount(id);
    }
}