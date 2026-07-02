package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.CustomerTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.SupplierTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.VaccinePriceDTO;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.HoSoBenhAn;
import com.vaccine.qltiemchungbackend.entity.HoaDon;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinanceService {

    @Autowired
    private VacXinRepository vacXinRepository;

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Autowired
    private HoSoBenhAnRepository hoSoBenhAnRepository;

    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    public List<VaccinePriceDTO> getAllVaccinePrices() {
        return vacXinRepository.findAllAvailable().stream().map(v -> {
            VaccinePriceDTO dto = new VaccinePriceDTO();
            dto.setId(v.getMaVacXin());
            dto.setName(v.getTenVacXin());
            dto.setDosage(v.getHamLuong() != null ? v.getHamLuong() : "Chưa cập nhật");
            dto.setYear(v.getHanSuDung() != null ? v.getHanSuDung().toString() : "---");
            dto.setPrice(v.getDonGia() != null ? v.getDonGia() : 0.0);
            return dto;
        }).collect(Collectors.toList());
    }

    public void updateVaccinePrice(Long id, VaccinePriceDTO request) {
        VacXin vacXin = vacXinRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy vắc-xin!"));
        vacXin.setDonGia(request.getPrice());
        vacXin.setHamLuong(request.getDosage());
        vacXinRepository.save(vacXin);
    }

    public void deleteVaccinePrice(Long id) {
        VacXin vacXin = vacXinRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy vắc-xin!"));
        vacXin.setFlagDelete(true);
        vacXinRepository.save(vacXin);
    }

    public List<CustomerTransactionDTO> getAllCustomerTransactions() {
        return hoaDonRepository.findAllCustomerTransactions().stream().map(p -> {
            CustomerTransactionDTO dto = new CustomerTransactionDTO();
            dto.setId(p.getId());
            dto.setDate(p.getDate());
            dto.setVaccineCode(p.getVaccineCode());
            dto.setQuantity(p.getQuantity());
            dto.setCustomerName(p.getCustomerName());
            dto.setPrice(p.getPrice());
            return dto;
        }).collect(Collectors.toList());
    }

    public void updateCustomerTransaction(Long id, CustomerTransactionDTO dto) {
        HoaDon hd = hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn giao dịch!"));
        hd.setTongTien(dto.getPrice());
        hoaDonRepository.save(hd);

        // THỰC HIỆN ĐỒNG BỘ DATA CHO CÁC BẢNG LIÊN QUAN
        HoSoBenhAn hsba = hoSoBenhAnRepository.findByMaHoaDon(id).orElse(null);
        if (hsba != null) {
            if (dto.getDate() != null && !dto.getDate().isEmpty()) {
                hsba.setThoiGianTiem(LocalDate.parse(dto.getDate()));
                hoSoBenhAnRepository.save(hsba);

                ChiTietDkTiem ct = hsba.getChiTietDkTiem();
                if (ct != null) {
                    ct.setThoiGianCanTiem(LocalDate.parse(dto.getDate()));
                    chiTietDkTiemRepository.save(ct);

                }
            }
        }
    }

    public void deleteCustomerTransaction(Long id) {
        HoaDon hd = hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn giao dịch!"));
        hd.setFlagDelete(true);
        hoaDonRepository.save(hd);
    }

    public List<SupplierTransactionDTO> getAllSupplierTransactions() {
        return hoaDonRepository.findAllSupplierTransactions().stream().map(p -> {
            SupplierTransactionDTO dto = new SupplierTransactionDTO();
            dto.setId(p.getId());
            dto.setDate(p.getDate());
            dto.setVaccineCode(p.getVaccineCode());
            dto.setQuantity(p.getQuantity());
            dto.setSupplierName(p.getSupplierName());
            dto.setPrice(p.getPrice());
            return dto;
        }).collect(Collectors.toList());
    }

    public void createSupplierTransaction(SupplierTransactionDTO dto) {
        HoaDon hd = new HoaDon();
        hd.setTongTien(dto.getPrice());
        hd.setFlagDelete(false);
        hoaDonRepository.save(hd);
    }

    public void updateSupplierTransaction(Long id, SupplierTransactionDTO dto) {
        HoaDon hd = hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));
        hd.setTongTien(dto.getPrice());
        hoaDonRepository.save(hd);
    }

    public void deleteSupplierTransaction(Long id) {
        HoaDon hd = hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));
        hd.setFlagDelete(true);
        hoaDonRepository.save(hd);
    }
}