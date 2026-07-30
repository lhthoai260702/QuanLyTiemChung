package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.BookingRequestDTO;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LichTiemChungRepository;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private BenhNhanRepository benhNhanRepository;
    @Mock
    private LoVacXinRepository loVacXinRepository;
    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Mock
    private LichTiemChungRepository lichTiemChungRepository;

    @InjectMocks
    private CustomerService customerService;

    private BookingRequestDTO requestDTO;
    private BenhNhan mockBenhNhan;
    private LichTiemChung mockLichTiem;
    private LoVacXin mockLoVacXin;

    @BeforeEach
    void setUp() {
        // Mock dữ liệu đầu vào DTO
        requestDTO = new BookingRequestDTO();
        requestDTO.setMaBenhNhan(1L);
        requestDTO.setNgayMongMuon(LocalDate.of(2026, 8, 1));
        requestDTO.setGioMongMuon("08:00 - 10:00");

        // Mock Bệnh nhân
        mockBenhNhan = new BenhNhan();
        mockBenhNhan.setMaBenhNhan(1L);
        mockBenhNhan.setTenBenhNhan("Khách Hàng A");

        // Mock Lịch tiêm trung tâm
        mockLichTiem = new LichTiemChung();
        mockLichTiem.setMaLichTiem(10L);
        mockLichTiem.setSoLuongNguoiTiem(50);
        mockLichTiem.setMaLoaiVacXin(100L);
        mockLichTiem.setNgayTiem(LocalDate.of(2026, 8, 15));
        mockLichTiem.setThoiGianChung("13:00 - 15:00");

        // Mock Lô Vắc-xin
        mockLoVacXin = new LoVacXin();
        mockLoVacXin.setMaLo(999L);
    }

    // ==========================================
    // TEST KIỂM TRA ĐIỀU KIỆN CHUNG (VALIDATION)
    // ==========================================

    @Test
    void bookVaccine_PatientNotFound_ThrowsException() {
        // Arrange
        when(benhNhanRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Không tìm thấy hồ sơ bệnh nhân!", ex.getMessage());
        verify(chiTietDkTiemRepository, never()).save(any());
    }

    // ==========================================
    // TEST LUỒNG: ĐĂNG KÝ THEO LỊCH TRUNG TÂM (maLichTiem != null)
    // ==========================================

    @Test
    void bookVaccine_Center_LichTiemNotFound_ThrowsException() {
        requestDTO.setMaLichTiem(10L);
        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(lichTiemChungRepository.findById(10L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Không tìm thấy lịch tiêm chủng trung tâm!", ex.getMessage());
    }

    @Test
    void bookVaccine_Center_NoSlots_ThrowsException() {
        requestDTO.setMaLichTiem(10L);
        mockLichTiem.setSoLuongNguoiTiem(0); // Hết chỗ

        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(lichTiemChungRepository.findById(10L)).thenReturn(Optional.of(mockLichTiem));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Lịch tiêm này đã hết chỗ!", ex.getMessage());
        verify(lichTiemChungRepository, never()).saveAndFlush(any());
    }

    @Test
    void bookVaccine_Center_NoVaccineType_ThrowsException() {
        requestDTO.setMaLichTiem(10L);
        mockLichTiem.setMaLoaiVacXin(null); // Chưa gán loại vacxin

        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(lichTiemChungRepository.findById(10L)).thenReturn(Optional.of(mockLichTiem));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Lịch tiêm chủng này hiện chưa được phân bổ loại vắc-xin!", ex.getMessage());
    }

    @Test
    void bookVaccine_Center_NoAvailableLot_ThrowsException() {
        requestDTO.setMaLichTiem(10L);
        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(lichTiemChungRepository.findById(10L)).thenReturn(Optional.of(mockLichTiem));
        when(loVacXinRepository.findAvailableLotByLoaiVacXinId(100L)).thenReturn(Optional.empty()); // Hết hàng trong kho

        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Rất tiếc, vắc-xin cho lịch tiêm này hiện đã hết hàng trong kho!", ex.getMessage());
    }

    @Test
    void bookVaccine_Center_Success() {
        // Arrange
        requestDTO.setMaLichTiem(10L);
        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(lichTiemChungRepository.findById(10L)).thenReturn(Optional.of(mockLichTiem));
        when(loVacXinRepository.findAvailableLotByLoaiVacXinId(100L)).thenReturn(Optional.of(mockLoVacXin));

        // Act
        customerService.bookVaccine(requestDTO);

        // Assert - Kiểm tra số lượng đã bị trừ
        ArgumentCaptor<LichTiemChung> lichTiemCaptor = ArgumentCaptor.forClass(LichTiemChung.class);
        verify(lichTiemChungRepository).saveAndFlush(lichTiemCaptor.capture());
        assertEquals(49, lichTiemCaptor.getValue().getSoLuongNguoiTiem()); // 50 - 1 = 49

        // Assert - Kiểm tra ChiTietDkTiem được tạo đúng thông tin
        ArgumentCaptor<ChiTietDkTiem> chiTietCaptor = ArgumentCaptor.forClass(ChiTietDkTiem.class);
        verify(chiTietDkTiemRepository).save(chiTietCaptor.capture());

        ChiTietDkTiem savedDK = chiTietCaptor.getValue();
        assertEquals(mockBenhNhan, savedDK.getBenhNhan());
        assertEquals("Chưa tiêm", savedDK.getTrangThai());
        assertFalse(savedDK.getFlagDelete());
        assertEquals(999L, savedDK.getMaLo());
        assertEquals(10L, savedDK.getMaLichTiem());
        assertEquals(LocalDate.of(2026, 8, 15), savedDK.getThoiGianCanTiem()); // Ưu tiên ngày của lịch tiêm
        assertEquals("13:00 - 15:00", savedDK.getGioTiem());
    }

    // ==========================================
    // TEST LUỒNG: ĐĂNG KÝ TỰ DO (maLichTiem == null)
    // ==========================================

    @Test
    void bookVaccine_Free_NoAvailableLot_ThrowsException() {
        requestDTO.setMaLichTiem(null);
        requestDTO.setMaVacXin(200L); // Mã vắc xin cụ thể người dùng chọn

        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(loVacXinRepository.findAvailableLotByVaccineId(200L)).thenReturn(Optional.empty()); // Hết hàng

        RuntimeException ex = assertThrows(RuntimeException.class, () -> customerService.bookVaccine(requestDTO));
        assertEquals("Rất tiếc, vắc-xin này hiện đã hết hàng trong kho!", ex.getMessage());
    }

    @Test
    void bookVaccine_Free_Success() {
        // Arrange
        requestDTO.setMaLichTiem(null);
        requestDTO.setMaVacXin(200L);

        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(loVacXinRepository.findAvailableLotByVaccineId(200L)).thenReturn(Optional.of(mockLoVacXin));

        // Act
        customerService.bookVaccine(requestDTO);

        // Assert - Lịch tự do không trừ slot trung tâm
        verify(lichTiemChungRepository, never()).saveAndFlush(any());

        // Assert - Kiểm tra ChiTietDkTiem
        ArgumentCaptor<ChiTietDkTiem> chiTietCaptor = ArgumentCaptor.forClass(ChiTietDkTiem.class);
        verify(chiTietDkTiemRepository).save(chiTietCaptor.capture());

        ChiTietDkTiem savedDK = chiTietCaptor.getValue();
        assertEquals(mockBenhNhan, savedDK.getBenhNhan());
        assertEquals(999L, savedDK.getMaLo());
        assertNull(savedDK.getMaLichTiem());
        assertEquals(LocalDate.of(2026, 8, 1), savedDK.getThoiGianCanTiem()); // Lấy ngày theo DTO yêu cầu
        assertEquals("08:00 - 10:00", savedDK.getGioTiem()); // Lấy giờ theo DTO yêu cầu
    }
}