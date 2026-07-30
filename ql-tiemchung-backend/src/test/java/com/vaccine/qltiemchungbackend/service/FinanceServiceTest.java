package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.HoSoBenhAn;
import com.vaccine.qltiemchungbackend.entity.HoaDon;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.*;
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
class FinanceServiceTest {

    @Mock
    private VacXinRepository vacXinRepository;
    @Mock
    private HoaDonRepository hoaDonRepository;
    @Mock
    private HoSoBenhAnRepository hoSoBenhAnRepository;
    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Mock
    private BenhNhanRepository benhNhanRepository;

    @InjectMocks
    private FinanceService financeService;

    private VacXin mockVacXin;
    private HoaDon mockHoaDon;

    @BeforeEach
    void setUp() {
        mockVacXin = new VacXin();
        mockVacXin.setMaVacXin(1L);
        mockVacXin.setTenVacXin("Pfizer");
        mockVacXin.setHamLuong("0.3ml");
        mockVacXin.setHanSuDung(LocalDate.of(2027, 12, 31));
        mockVacXin.setDonGia(600000.0);
        mockVacXin.setFlagDelete(false);

        mockHoaDon = new HoaDon();
        mockHoaDon.setMaHoaDon(1L);
        mockHoaDon.setTongTien(500000.0);
        mockHoaDon.setFlagDelete(false);
    }

    // ==========================================
    // TEST VACCINE PRICES
    // ==========================================

    @Test
    void getAllVaccinePrices_ReturnsDtoList() {
        // Arrange
        when(vacXinRepository.findAllAvailable()).thenReturn(List.of(mockVacXin));

        // Act
        List<VaccinePriceDTO> result = financeService.getAllVaccinePrices();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Pfizer", result.get(0).getName());
        assertEquals("0.3ml", result.get(0).getDosage());
        assertEquals("2027-12-31", result.get(0).getYear());
        assertEquals(600000.0, result.get(0).getPrice());
        verify(vacXinRepository, times(1)).findAllAvailable();
    }

    @Test
    void updateVaccinePrice_Success() {
        // Arrange
        VaccinePriceDTO request = new VaccinePriceDTO();
        request.setPrice(650000.0);
        request.setDosage("0.5ml");

        when(vacXinRepository.findById(1L)).thenReturn(Optional.of(mockVacXin));

        // Act
        financeService.updateVaccinePrice(1L, request);

        // Assert
        assertEquals(650000.0, mockVacXin.getDonGia());
        assertEquals("0.5ml", mockVacXin.getHamLuong());
        verify(vacXinRepository, times(1)).save(mockVacXin);
    }

    @Test
    void updateVaccinePrice_NotFound_ThrowsException() {
        // Arrange
        when(vacXinRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> financeService.updateVaccinePrice(99L, new VaccinePriceDTO()));
        assertEquals("Không tìm thấy vắc-xin!", exception.getMessage());
    }

    @Test
    void deleteVaccinePrice_Success() {
        // Arrange
        when(vacXinRepository.findById(1L)).thenReturn(Optional.of(mockVacXin));

        // Act
        financeService.deleteVaccinePrice(1L);

        // Assert
        assertTrue(mockVacXin.getFlagDelete());
        verify(vacXinRepository, times(1)).save(mockVacXin);
    }

    // ==========================================
    // TEST CUSTOMER TRANSACTIONS
    // ==========================================

    @Test
    void getAllCustomerTransactions_ReturnsList() {
        // Arrange
        CustomerTransactionProjection mockProj = mock(CustomerTransactionProjection.class);
        // CẬP NHẬT: Trả về String thay vì Long
        when(mockProj.getId()).thenReturn("HD001");
        when(mockProj.getCustomerName()).thenReturn("Nguyen Van A");

        List<CustomerTransactionProjection> projections = List.of(mockProj);
        when(hoaDonRepository.findAllCustomerTransactions()).thenReturn(projections);

        // Act
        List<CustomerTransactionDTO> result = financeService.getAllCustomerTransactions();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        // CẬP NHẬT: So sánh với String
        assertEquals("HD001", result.get(0).getId());
        assertEquals("Nguyen Van A", result.get(0).getCustomerName());
    }

    @Test
    void updateCustomerTransaction_Success_WithHoSoBenhAn() {
        // Arrange
        CustomerTransactionDTO dto = new CustomerTransactionDTO();
        dto.setId("HD001");
        dto.setPrice(1000000.0);
        dto.setDate("2026-12-01");

        when(hoaDonRepository.findById(1L)).thenReturn(Optional.of(mockHoaDon));

        HoSoBenhAn mockHsba = new HoSoBenhAn();
        ChiTietDkTiem mockCt = new ChiTietDkTiem();
        mockHsba.setChiTietDkTiem(mockCt);
        when(hoSoBenhAnRepository.findByMaHoaDon(1L)).thenReturn(Optional.of(mockHsba));

        // Act
        financeService.updateCustomerTransaction(1L, dto);

        // Assert
        assertEquals(1000000.0, mockHoaDon.getTongTien());
        assertEquals(LocalDate.parse("2026-12-01"), mockHsba.getThoiGianTiem());
        assertEquals(LocalDate.parse("2026-12-01"), mockCt.getThoiGianCanTiem());

        verify(hoaDonRepository, times(1)).save(mockHoaDon);
        verify(hoSoBenhAnRepository, times(1)).save(mockHsba);
        verify(chiTietDkTiemRepository, times(1)).save(mockCt);
    }

    @Test
    void deleteCustomerTransaction_Success() {
        // Arrange
        when(hoaDonRepository.findById(1L)).thenReturn(Optional.of(mockHoaDon));

        // Act
        financeService.deleteCustomerTransaction(1L);

        // Assert
        assertTrue(mockHoaDon.getFlagDelete());
        verify(hoaDonRepository, times(1)).save(mockHoaDon);
    }

    // ==========================================
    // TEST SUPPLIER TRANSACTIONS
    // ==========================================

    @Test
    void getAllSupplierTransactions_ReturnsList() {
        // Arrange
        SupplierTransactionProjection mockProj = mock(SupplierTransactionProjection.class);
        // Lưu ý: Nếu SupplierTransactionProjection cũng đổi id sang String,
        // bạn cũng cần sửa lại when(mockProj.getId()).thenReturn("SP001"); giống hệt bên trên nhé.
        when(mockProj.getSupplierName()).thenReturn("VNVC");

        List<SupplierTransactionProjection> projections = List.of(mockProj);
        when(hoaDonRepository.findAllSupplierTransactions()).thenReturn(projections);

        // Act
        List<SupplierTransactionDTO> result = financeService.getAllSupplierTransactions();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("VNVC", result.get(0).getSupplierName());
    }

    @Test
    void createSupplierTransaction_Success() {
        // Arrange
        SupplierTransactionDTO dto = new SupplierTransactionDTO();
        dto.setPrice(5000000.0);

        // Act
        financeService.createSupplierTransaction(dto);

        // Assert
        verify(hoaDonRepository, times(1)).save(any(HoaDon.class));
    }

    @Test
    void updateSupplierTransaction_Success() {
        // Arrange
        SupplierTransactionDTO dto = new SupplierTransactionDTO();
        dto.setPrice(999999.0);
        when(hoaDonRepository.findById(1L)).thenReturn(Optional.of(mockHoaDon));

        // Act
        financeService.updateSupplierTransaction(1L, dto);

        // Assert
        assertEquals(999999.0, mockHoaDon.getTongTien());
        verify(hoaDonRepository, times(1)).save(mockHoaDon);
    }

    @Test
    void deleteSupplierTransaction_Success() {
        // Arrange
        when(hoaDonRepository.findById(1L)).thenReturn(Optional.of(mockHoaDon));

        // Act
        financeService.deleteSupplierTransaction(1L);

        // Assert
        assertTrue(mockHoaDon.getFlagDelete());
        verify(hoaDonRepository, times(1)).save(mockHoaDon);
    }
}