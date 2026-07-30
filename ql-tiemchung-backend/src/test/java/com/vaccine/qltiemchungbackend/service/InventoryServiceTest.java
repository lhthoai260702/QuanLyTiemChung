package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.*;
import com.vaccine.qltiemchungbackend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private LoVacXinRepository loVacXinRepository;
    @Mock
    private VacXinRepository vacXinRepository;
    @Mock
    private LoaiVacXinRepository loaiVacXinRepository;
    @Mock
    private NhaCungCapRepository nhaCungCapRepository;
    @Mock
    private HoaDonRepository hoaDonRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private KhoVacXinDTO dto;
    private LoVacXin mockLoVacXin;
    private VacXin mockVacXin;
    private LoaiVacXin mockLoaiVacXin;
    private NhaCungCap mockNhaCungCap;

    @BeforeEach
    void setUp() {
        dto = new KhoVacXinDTO();
        dto.setTenVacXin("AstraZeneca");
        dto.setLoaiVacXin("COVID-19");
        dto.setTenNhaCungCap("VNVC");
        dto.setSoLuong(100);
        dto.setDonGia(500000.0);

        mockLoVacXin = new LoVacXin();
        mockLoVacXin.setMaLo(1L);
        mockLoVacXin.setSoLuong(100);
        mockLoVacXin.setMaHoaDon(1L);

        mockVacXin = new VacXin();
        mockVacXin.setMaVacXin(1L);

        mockLoaiVacXin = new LoaiVacXin();
        mockLoaiVacXin.setMaLoaiVacXin(1L);
        mockLoaiVacXin.setTenLoaiVacXin("COVID-19");

        mockNhaCungCap = new NhaCungCap();
        mockNhaCungCap.setMaNhaCungCap(1L);
    }

    @Test
    void getAllKhoVacXin_ShouldReturnList() {
        // Arrange
        when(loVacXinRepository.findAllKhoVacXin()).thenReturn(Arrays.asList(new KhoVacXinDTO(), new KhoVacXinDTO()));

        // Act
        List<KhoVacXinDTO> result = inventoryService.getAllKhoVacXin();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(loVacXinRepository, times(1)).findAllKhoVacXin();
    }

    @Test
    void getAllLoaiVacXin_ShouldReturnList() {
        // Arrange
        when(loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull()).thenReturn(Arrays.asList(new LoaiVacXin()));

        // Act
        List<LoaiVacXin> result = inventoryService.getAllLoaiVacXin();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(loaiVacXinRepository, times(1)).findByFlagDeleteFalseOrFlagDeleteIsNull();
    }

    @Test
    void saveOrUpdateKhoVacXin_CreateNewRecord_Success() {
        // Arrange: Test trường hợp DTO không chứa ID (Thêm mới hoàn toàn)
        dto.setMaVacXin(null);
        dto.setMaNhaCungCap(null);
        dto.setSoLo(null);

        when(loaiVacXinRepository.findByTenLoaiVacXin("COVID-19")).thenReturn(Optional.of(mockLoaiVacXin));
        when(vacXinRepository.save(any(VacXin.class))).thenReturn(mockVacXin);
        when(nhaCungCapRepository.save(any(NhaCungCap.class))).thenReturn(mockNhaCungCap);

        HoaDon mockHoaDon = new HoaDon();
        mockHoaDon.setMaHoaDon(1L);
        when(hoaDonRepository.save(any(HoaDon.class))).thenReturn(mockHoaDon);

        when(loVacXinRepository.save(any(LoVacXin.class))).thenReturn(mockLoVacXin);

        // Act
        KhoVacXinDTO result = inventoryService.saveOrUpdateKhoVacXin(dto);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getSoLo()); // ID Lô phải được gán lại vào DTO
        verify(vacXinRepository, times(1)).save(any(VacXin.class));
        verify(nhaCungCapRepository, times(1)).save(any(NhaCungCap.class));
        verify(hoaDonRepository, times(1)).save(any(HoaDon.class));
        verify(loVacXinRepository, times(1)).save(any(LoVacXin.class));
    }

    @Test
    void exportVaccine_Success() {
        // Arrange
        when(loVacXinRepository.findById(1L)).thenReturn(Optional.of(mockLoVacXin));

        // Act
        // Lưu ý: Hàm exportVaccine có Thread.sleep(5000), test case này sẽ mất khoảng 5 giây để chạy xong
        inventoryService.exportVaccine(1L, 20);

        // Assert
        assertEquals(80, mockLoVacXin.getSoLuong()); // 100 - 20 = 80
        verify(loVacXinRepository, times(1)).saveAndFlush(mockLoVacXin);
    }

    @Test
    void exportVaccine_NotEnoughQuantity_ThrowsException() {
        // Arrange
        when(loVacXinRepository.findById(1L)).thenReturn(Optional.of(mockLoVacXin));

        // Act & Assert
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> inventoryService.exportVaccine(1L, 150) // Tồn kho 100, xuất 150 -> Lỗi
        );
        assertEquals("Số lượng xuất vượt quá tồn kho!", exception.getMessage());
        verify(loVacXinRepository, never()).saveAndFlush(any());
    }

    @Test
    void deleteKhoVacXin_Success() {
        // Arrange
        when(loVacXinRepository.findById(1L)).thenReturn(Optional.of(mockLoVacXin));

        // Act
        inventoryService.deleteKhoVacXin(1L);

        // Assert
        assertTrue(mockLoVacXin.getFlagDelete());
        verify(loVacXinRepository, times(1)).save(mockLoVacXin);
    }

    @Test
    void deleteKhoVacXin_NotFound_ThrowsException() {
        // Arrange
        when(loVacXinRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> inventoryService.deleteKhoVacXin(99L)
        );
        assertEquals("Không tìm thấy Lô Vắc-xin số: 99", exception.getMessage());
        verify(loVacXinRepository, never()).save(any());
    }
}