package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.BenhNhanDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemProjection;
import com.vaccine.qltiemchungbackend.entity.*;
import com.vaccine.qltiemchungbackend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BenhNhanServiceTest {

    @Mock
    private BenhNhanRepository repository;
    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Mock
    private HoSoBenhAnRepository hoSoBenhAnRepository;
    @Mock
    private HoaDonRepository hoaDonRepository;
    @Mock
    private LoVacXinRepository loVacXinRepository;
    @Mock
    private TaiKhoanRepository taiKhoanRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private BenhNhanService benhNhanService;

    private BenhNhan mockBenhNhan;
    private BenhNhanDTO mockBenhNhanDTO;
    private TaiKhoan mockTaiKhoan;
    private ChiTietDkTiem mockChiTiet;
    private LoVacXin mockLoVacXin;
    private VacXin mockVacXin;

    @BeforeEach
    void setUp() {
        // Khởi tạo Bệnh Nhân
        mockBenhNhan = new BenhNhan();
        mockBenhNhan.setMaBenhNhan(1L);
        mockBenhNhan.setTenBenhNhan("Nguyễn Văn A");
        mockBenhNhan.setNgaySinh(LocalDate.of(1990, 1, 1));
        mockBenhNhan.setMaTaiKhoan(100L);

        // Khởi tạo DTO
        mockBenhNhanDTO = new BenhNhanDTO();
        mockBenhNhanDTO.setFullName("Nguyễn Văn A - Updated");
        mockBenhNhanDTO.setAge(30);
        mockBenhNhanDTO.setMatKhau("new_password");

        // Khởi tạo Tài Khoản
        mockTaiKhoan = new TaiKhoan();
        mockTaiKhoan.setMaTaiKhoan(100L);
        mockTaiKhoan.setCmnd("123456789");

        // Khởi tạo Chi Tiết Tiêm
        mockChiTiet = new ChiTietDkTiem();
        // Sửa lại thành setMaChiTietDkTiem để khớp với Entity của bạn
        mockChiTiet.setMaChiTietDkTiem(50L);
        mockChiTiet.setTrangThai("Chờ tiêm");
        mockChiTiet.setMaLo(200L);
        mockChiTiet.setFlagDelete(false);

        // Khởi tạo Lô & Vacxin
        mockVacXin = new VacXin();
        mockVacXin.setDonGia(500000.0);
        mockLoVacXin = new LoVacXin();
        mockLoVacXin.setMaLo(200L);
        mockLoVacXin.setVacXin(mockVacXin);
    }

    // ==========================================
    // GET & UPDATE PATIENT
    // ==========================================

    @Test
    void getPatientByUsername_Success() {
        // Arrange
        when(repository.findByUsername("userA")).thenReturn(Optional.of(mockBenhNhan));
        when(repository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(taiKhoanRepository.findById(100L)).thenReturn(Optional.of(mockTaiKhoan));
        when(repository.findLichSuTiemByMaBenhNhan(1L)).thenReturn(Collections.emptyList());

        // Act
        BenhNhanDTO result = benhNhanService.getPatientByUsername("userA");

        // Assert
        assertNotNull(result);
        assertEquals("Nguyễn Văn A", result.getFullName());
        assertEquals("123456789", result.getCmnd());
    }

    @Test
    void getPatientByUsername_NotFound_ThrowsException() {
        when(repository.findByUsername("unknown")).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> benhNhanService.getPatientByUsername("unknown"));
        assertEquals("Không tìm thấy hồ sơ bệnh nhân", ex.getMessage());
    }

    @Test
    void getAllPatients_ReturnsList() {
        // Arrange
        when(repository.findByFlagDeleteFalseOrFlagDeleteIsNull()).thenReturn(List.of(mockBenhNhan));
        when(taiKhoanRepository.findById(100L)).thenReturn(Optional.of(mockTaiKhoan));

        LichSuTiemProjection mockProjection = mock(LichSuTiemProjection.class);
        when(mockProjection.getRecordId()).thenReturn(50L);
        when(mockProjection.getVaccineName()).thenReturn("AstraZeneca");
        when(repository.findLichSuTiemByMaBenhNhan(1L)).thenReturn(List.of(mockProjection));

        // Act
        List<BenhNhanDTO> result = benhNhanService.getAllPatients();

        // Assert
        assertEquals(1, result.size());
        assertEquals("Nguyễn Văn A", result.get(0).getFullName());
        assertEquals(1, result.get(0).getHistory().size());
        assertEquals("AstraZeneca", result.get(0).getHistory().get(0).getVaccineName());
    }

    @Test
    void updatePatient_SuccessWithPasswordChange() {
        // Arrange
        when(repository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(taiKhoanRepository.findById(100L)).thenReturn(Optional.of(mockTaiKhoan));
        when(passwordEncoder.encode("new_password")).thenReturn("encoded_new_password");

        // Act
        benhNhanService.updatePatient(1L, mockBenhNhanDTO);

        // Assert
        verify(repository).save(mockBenhNhan);
        assertEquals("Nguyễn Văn A - Updated", mockBenhNhan.getTenBenhNhan());
        verify(taiKhoanRepository).save(mockTaiKhoan);
        assertEquals("encoded_new_password", mockTaiKhoan.getMatKhau());
    }

    // ==========================================
    // HISTORY RECORD (CHI TIẾT TIÊM & BỆNH ÁN)
    // ==========================================

    @Test
    void updateHistoryRecord_StatusDaTiem_CreatesHoaDonAndBenhAn() {
        // Arrange
        LichSuTiemDTO historyDTO = new LichSuTiemDTO();
        historyDTO.setStatus("Đã tiêm");
        historyDTO.setDate("2026-07-29");
        historyDTO.setSideEffect("Sốt nhẹ");

        when(chiTietDkTiemRepository.findById(50L)).thenReturn(Optional.of(mockChiTiet));
        when(hoSoBenhAnRepository.findByMaChiTietDkTiem(50L)).thenReturn(Optional.empty()); // Chưa tiêm
        when(loVacXinRepository.findById(200L)).thenReturn(Optional.of(mockLoVacXin));

        HoaDon savedHoaDon = new HoaDon();
        savedHoaDon.setMaHoaDon(99L);
        when(hoaDonRepository.save(any(HoaDon.class))).thenReturn(savedHoaDon);

        // Act
        benhNhanService.updateHistoryRecord(50L, historyDTO);

        // Assert
        assertEquals("Đã tiêm", mockChiTiet.getTrangThai());
        verify(chiTietDkTiemRepository).save(mockChiTiet);

        // Kiểm tra tạo hóa đơn đúng giá tiền vacxin
        ArgumentCaptor<HoaDon> hoaDonCaptor = ArgumentCaptor.forClass(HoaDon.class);
        verify(hoaDonRepository).save(hoaDonCaptor.capture());
        assertEquals(500000.0, hoaDonCaptor.getValue().getTongTien());

        // Kiểm tra tạo bệnh án
        ArgumentCaptor<HoSoBenhAn> benhAnCaptor = ArgumentCaptor.forClass(HoSoBenhAn.class);
        verify(hoSoBenhAnRepository).save(benhAnCaptor.capture());
        assertEquals(99L, benhAnCaptor.getValue().getMaHoaDon());
        assertEquals("Sốt nhẹ", benhAnCaptor.getValue().getPhanUngSauTiem());
    }

    @Test
    void updateHistoryRecord_AlreadyDaTiem_UpdatesBenhAnOnly() {
        // Arrange
        mockChiTiet.setTrangThai("Đã tiêm");
        HoSoBenhAn mockBenhAn = new HoSoBenhAn();

        LichSuTiemDTO historyDTO = new LichSuTiemDTO();
        historyDTO.setSideEffect("Sốt cao");

        when(chiTietDkTiemRepository.findById(50L)).thenReturn(Optional.of(mockChiTiet));
        when(hoSoBenhAnRepository.findByMaChiTietDkTiem(50L)).thenReturn(Optional.of(mockBenhAn));

        // Act
        benhNhanService.updateHistoryRecord(50L, historyDTO);

        // Assert
        verify(chiTietDkTiemRepository, never()).save(any(ChiTietDkTiem.class)); // Không cập nhật lại chi tiết
        verify(hoaDonRepository, never()).save(any(HoaDon.class)); // Không tạo thêm hóa đơn

        verify(hoSoBenhAnRepository).save(mockBenhAn);
        assertEquals("Sốt cao", mockBenhAn.getPhanUngSauTiem());
    }

    @Test
    void deleteHistoryRecord_SoftDeletesBoth() {
        // Arrange
        HoSoBenhAn mockBenhAn = new HoSoBenhAn();
        when(chiTietDkTiemRepository.findById(50L)).thenReturn(Optional.of(mockChiTiet));
        when(hoSoBenhAnRepository.findByMaChiTietDkTiem(50L)).thenReturn(Optional.of(mockBenhAn));

        // Act
        benhNhanService.deleteHistoryRecord(50L);

        // Assert
        assertTrue(mockChiTiet.getFlagDelete());
        verify(chiTietDkTiemRepository).save(mockChiTiet);

        assertTrue(mockBenhAn.getFlagDelete());
        verify(hoSoBenhAnRepository).save(mockBenhAn);
    }

    // ==========================================
    // VNPAY PAYMENT FLOW
    // ==========================================

    @Test
    void preparePayment_LocksStatusAndReturnsPrice() {
        // Arrange
        LichSuTiemDTO dto = new LichSuTiemDTO();
        dto.setRecordId(50L);
        dto.setSideEffect("Không");
        dto.setThoiGianTacDung("15p");

        when(chiTietDkTiemRepository.findById(50L)).thenReturn(Optional.of(mockChiTiet));
        when(loVacXinRepository.findById(200L)).thenReturn(Optional.of(mockLoVacXin));

        // Act
        Double price = benhNhanService.preparePayment(dto);

        // Assert
        assertEquals(500000.0, price);
        assertEquals("Chờ thanh toán", mockChiTiet.getTrangThai());
        assertEquals("Phản ứng: Không | Thời gian: 15p", mockChiTiet.getGhiChu());
        verify(chiTietDkTiemRepository).save(mockChiTiet);
    }

    @Test
    void confirmPaymentSuccess_UpdatesStatusAndCreatesRecords() {
        // Arrange
        mockChiTiet.setTrangThai("Chờ thanh toán");
        mockChiTiet.setGhiChu("Phản ứng: Sốt | Thời gian: 30p");

        when(chiTietDkTiemRepository.findById(50L)).thenReturn(Optional.of(mockChiTiet));
        when(loVacXinRepository.findById(200L)).thenReturn(Optional.of(mockLoVacXin));

        HoaDon mockHoaDon = new HoaDon();
        mockHoaDon.setMaHoaDon(77L);
        when(hoaDonRepository.save(any(HoaDon.class))).thenReturn(mockHoaDon);

        // Act
        benhNhanService.confirmPaymentSuccess(50L);

        // Assert
        assertEquals("Đã tiêm", mockChiTiet.getTrangThai());
        verify(chiTietDkTiemRepository).save(mockChiTiet);

        ArgumentCaptor<HoSoBenhAn> benhAnCaptor = ArgumentCaptor.forClass(HoSoBenhAn.class);
        verify(hoSoBenhAnRepository).save(benhAnCaptor.capture());
        assertEquals(77L, benhAnCaptor.getValue().getMaHoaDon());
        assertEquals("Phản ứng: Sốt | Thời gian: 30p", benhAnCaptor.getValue().getPhanUngSauTiem());
        assertEquals("Đã thanh toán qua VNPay", benhAnCaptor.getValue().getThoiGianTacDung());
    }
}