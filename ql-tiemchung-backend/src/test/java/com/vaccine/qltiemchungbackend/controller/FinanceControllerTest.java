package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.CustomerTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.SupplierTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.VaccinePriceDTO;
import com.vaccine.qltiemchungbackend.service.FinanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FinanceControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FinanceService financeService;

    @InjectMocks
    private FinanceController financeController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Thiết lập MockMvc với CharacterEncodingFilter để ép chuẩn UTF-8 (Chống lỗi font tiếng Việt)
        mockMvc = MockMvcBuilders.standaloneSetup(financeController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST VACCINE PRICES (GIÁ VẮC-XIN)
    // ==========================================

    @Test
    void getAllVaccinePrices_Success() throws Exception {
        // Arrange
        VaccinePriceDTO dto = new VaccinePriceDTO();
        dto.setId(1L);
        dto.setName("AstraZeneca");
        dto.setPrice(500000.0);

        when(financeService.getAllVaccinePrices()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/finance/vaccine-prices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("AstraZeneca"))
                .andExpect(jsonPath("$[0].price").value(500000.0));
    }

    @Test
    void updateVaccinePrice_Success() throws Exception {
        // Arrange
        VaccinePriceDTO request = new VaccinePriceDTO();
        request.setPrice(600000.0);

        doNothing().when(financeService).updateVaccinePrice(eq(1L), any(VaccinePriceDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/finance/vaccine-prices/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật giá thành công!"));
    }

    @Test
    void updateVaccinePrice_Failure() throws Exception {
        // Arrange
        VaccinePriceDTO request = new VaccinePriceDTO();
        doThrow(new RuntimeException("Không tìm thấy vắc-xin")).when(financeService).updateVaccinePrice(eq(1L), any(VaccinePriceDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/finance/vaccine-prices/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Không tìm thấy vắc-xin"));
    }

    @Test
    void deleteVaccinePrice_Success() throws Exception {
        // Arrange
        doNothing().when(financeService).deleteVaccinePrice(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/finance/vaccine-prices/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa mềm thành công!"));
    }

    // ==========================================
    // TEST CUSTOMER TRANSACTIONS (GIAO DỊCH KHÁCH HÀNG)
    // ==========================================

    @Test
    void getAllCustomerTransactions_Success() throws Exception {
        // Arrange
        CustomerTransactionDTO dto = new CustomerTransactionDTO();
        dto.setId("HD001");
        dto.setCustomerName("Nguyen Van A");

        when(financeService.getAllCustomerTransactions()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/finance/customer-transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerName").value("Nguyen Van A"));
    }

    @Test
    void updateCustomerTransaction_Success() throws Exception {
        // Arrange
        CustomerTransactionDTO request = new CustomerTransactionDTO();
        request.setPrice(1500000.0);

        doNothing().when(financeService).updateCustomerTransaction(eq(1L), any(CustomerTransactionDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/finance/customer-transactions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật hóa đơn thành công!"));
    }

    @Test
    void deleteCustomerTransaction_Success() throws Exception {
        // Arrange
        doNothing().when(financeService).deleteCustomerTransaction(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/finance/customer-transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa hóa đơn thành công!"));
    }

    // ==========================================
    // TEST SUPPLIER TRANSACTIONS (GIAO DỊCH NHÀ CUNG CẤP)
    // ==========================================

    @Test
    void getAllSupplierTransactions_Success() throws Exception {
        // Arrange
        SupplierTransactionDTO dto = new SupplierTransactionDTO();
        dto.setId("SP001"); // Đã sửa lỗi: Dùng String thay vì Long
        dto.setSupplierName("VNVC");

        when(financeService.getAllSupplierTransactions()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/finance/supplier-transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].supplierName").value("VNVC"));
    }

    @Test
    void createSupplierTransaction_Success() throws Exception {
        // Arrange
        SupplierTransactionDTO request = new SupplierTransactionDTO();
        request.setPrice(50000000.0);

        doNothing().when(financeService).createSupplierTransaction(any(SupplierTransactionDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/finance/supplier-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tạo mới thành công!"));
    }

    @Test
    void createSupplierTransaction_Failure() throws Exception {
        // Arrange
        SupplierTransactionDTO request = new SupplierTransactionDTO();
        doThrow(new RuntimeException("Lỗi hệ thống")).when(financeService).createSupplierTransaction(any(SupplierTransactionDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/finance/supplier-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi tạo mới"));
    }

    @Test
    void updateSupplierTransaction_Success() throws Exception {
        // Arrange
        SupplierTransactionDTO request = new SupplierTransactionDTO();
        request.setPrice(45000000.0);

        doNothing().when(financeService).updateSupplierTransaction(eq(1L), any(SupplierTransactionDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/finance/supplier-transactions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Chỉnh sửa thành công!"));
    }

    @Test
    void deleteSupplierTransaction_Success() throws Exception {
        // Arrange
        doNothing().when(financeService).deleteSupplierTransaction(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/finance/supplier-transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành công!"));
    }

    @Test
    void deleteSupplierTransaction_Failure() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Không tìm thấy")).when(financeService).deleteSupplierTransaction(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/finance/supplier-transactions/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi xóa"));
    }
}