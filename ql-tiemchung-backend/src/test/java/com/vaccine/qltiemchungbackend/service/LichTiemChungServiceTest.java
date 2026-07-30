package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.dto.NguoiDangKyProjection;
import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LichTiemChungRepository;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LichTiemChungServiceTest {

    @Mock
    private LichTiemChungRepository lichTiemChungRepository;

    @Mock
    private LoaiVacXinRepository loaiVacXinRepository;

    @Mock
    private VacXinRepository vacXinRepository;

    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @InjectMocks
    private LichTiemChungService lichTiemChungService;

    private LichTiemChung mockLichTiem;
    private LichTiemChungDTO mockDTO;

    @BeforeEach
    void setUp() {
        // Dữ liệu giả lập cho Entity
        mockLichTiem = new LichTiemChung();
        mockLichTiem.setMaLichTiem(1L);
        mockLichTiem.setNgayTiem(LocalDate.of(2026, 7, 30));
        mockLichTiem.setThoiGianChung("08:00 - 11:00");
        mockLichTiem.setMaLoaiVacXin(1L);
        mockLichTiem.setMaVacXin(1L);
        mockLichTiem.setSoLuongNguoiTiem(50);
        mockLichTiem.setFlagDelete(false);

        // Dữ liệu giả lập cho DTO (Dùng cho thêm/sửa)
        mockDTO = new LichTiemChungDTO();
        mockDTO.setDateInput("2026-08-15");
        mockDTO.setThoiGian("13:00 - 16:00");
        mockDTO.setMaLoaiVacXin(2L);
        mockDTO.setMaVacXin(2L);
        mockDTO.setSelectedDoctors(List.of("Bac Si A", "Bac Si B"));
    }

    @Test
    void getAllSchedules_Success() {
        // Arrange
        when(lichTiemChungRepository.findByFlagDeleteFalseOrFlagDeleteIsNull())
                .thenReturn(List.of(mockLichTiem));

        LoaiVacXin mockLoai = new LoaiVacXin();
        mockLoai.setTenLoaiVacXin("Covid-19");
        when(loaiVacXinRepository.findById(1L)).thenReturn(Optional.of(mockLoai));

        VacXin mockVacXin = new VacXin();
        mockVacXin.setTenVacXin("AstraZeneca");
        when(vacXinRepository.findById(1L)).thenReturn(Optional.of(mockVacXin));

        when(lichTiemChungRepository.findDanhSachBacSiByLichTiem(1L))
                .thenReturn(List.of("Bac Si A"));

        // Cập nhật: Mock Interface NguoiDangKyProjection thay vì String
        NguoiDangKyProjection mockProjection = mock(NguoiDangKyProjection.class);
        when(mockProjection.getMaBenhNhan()).thenReturn("BN001");
        when(mockProjection.getTenBenhNhan()).thenReturn("Benh Nhan X");

        when(chiTietDkTiemRepository.findDanhSachNguoiDangKyByLichTiem(1L))
                .thenReturn(List.of(mockProjection));

        // Act
        List<LichTiemChungDTO> results = lichTiemChungService.getAllSchedules();

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        LichTiemChungDTO dto = results.get(0);
        assertEquals("LTC001", dto.getMaLichTiem());
        assertEquals("30", dto.getNgay());
        assertEquals("07", dto.getThang());
        assertEquals("2026", dto.getNam());
        assertEquals("Covid-19", dto.getLoaiVacXin());
        assertEquals("AstraZeneca", dto.getTenVacXin());
        assertEquals(1, dto.getDanhSachBacSi().size());
        assertEquals(1, dto.getDanhSachNguoiDangKy().size());

        // Kiểm tra dữ liệu danh sách người đăng ký có được gán đúng không
        NguoiDangKyProjection resultProj = (NguoiDangKyProjection) dto.getDanhSachNguoiDangKy().get(0);
        assertEquals("BN001", resultProj.getMaBenhNhan());
        assertEquals("Benh Nhan X", resultProj.getTenBenhNhan());
    }

    @Test
    void createSchedule_Success() {
        // Arrange
        // Lịch tiêm sau khi lưu sẽ được cấp phát ID là 10L
        LichTiemChung savedLichTiem = new LichTiemChung();
        savedLichTiem.setMaLichTiem(10L);

        when(lichTiemChungRepository.save(any(LichTiemChung.class))).thenReturn(savedLichTiem);
        when(lichTiemChungRepository.findMaNhanVienByTen("Bac Si A")).thenReturn(101L);
        when(lichTiemChungRepository.findMaNhanVienByTen("Bac Si B")).thenReturn(102L);

        // Act
        lichTiemChungService.createSchedule(mockDTO);

        // Assert
        verify(lichTiemChungRepository, times(1)).save(any(LichTiemChung.class));
        // Kiểm tra xem hàm insert bác sĩ có được gọi đúng số lần không
        verify(lichTiemChungRepository, times(1)).insertChiTietNhanVien(101L, 10L);
        verify(lichTiemChungRepository, times(1)).insertChiTietNhanVien(102L, 10L);
    }

    @Test
    void updateSchedule_Success() {
        // Arrange
        when(lichTiemChungRepository.findById(1L)).thenReturn(Optional.of(mockLichTiem));
        when(lichTiemChungRepository.findMaNhanVienByTen("Bac Si A")).thenReturn(101L);
        when(lichTiemChungRepository.findMaNhanVienByTen("Bac Si B")).thenReturn(102L);

        // Act
        lichTiemChungService.updateSchedule(1L, mockDTO);

        // Assert
        assertEquals(LocalDate.parse("2026-08-15"), mockLichTiem.getNgayTiem());
        assertEquals(2L, mockLichTiem.getMaLoaiVacXin());

        // Kiểm tra thứ tự gọi hàm: Lưu -> Xóa bác sĩ cũ -> Thêm bác sĩ mới
        verify(lichTiemChungRepository, times(1)).saveAndFlush(mockLichTiem);
        verify(lichTiemChungRepository, times(1)).deleteChiTietNhanVienByLichTiem(1L);
        verify(lichTiemChungRepository, times(1)).insertChiTietNhanVien(101L, 1L);
        verify(lichTiemChungRepository, times(1)).insertChiTietNhanVien(102L, 1L);
    }

    @Test
    void updateSchedule_NotFound_ThrowsException() {
        // Arrange
        when(lichTiemChungRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> lichTiemChungService.updateSchedule(99L, mockDTO));

        assertEquals("Không tìm thấy lịch tiêm!", exception.getMessage());
        verify(lichTiemChungRepository, never()).saveAndFlush(any());
    }

    @Test
    void deleteSchedule_Success() {
        // Arrange
        when(lichTiemChungRepository.findById(1L)).thenReturn(Optional.of(mockLichTiem));

        // Act
        lichTiemChungService.deleteSchedule(1L);

        // Assert
        assertTrue(mockLichTiem.getFlagDelete());
        verify(lichTiemChungRepository, times(1)).save(mockLichTiem);
    }

    @Test
    void deleteSchedule_NotFound_ThrowsException() {
        // Arrange
        when(lichTiemChungRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> lichTiemChungService.deleteSchedule(99L));

        assertEquals("Không tìm thấy lịch tiêm!", exception.getMessage());
        verify(lichTiemChungRepository, never()).save(any());
    }
}