package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.entity.NhaCungCap;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.NhaCungCapRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class InventoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private VacXinRepository vacXinRepository;

    @Mock
    private NhaCungCapRepository nhaCungCapRepository;

    @InjectMocks
    private InventoryController inventoryController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Khởi tạo MockMvc với CharacterEncodingFilter để ép chuẩn UTF-8 (Chống lỗi font tiếng Việt)
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST GET INVENTORY STATUS
    // ==========================================

    @Test
    void getInventoryStatus_Success() throws Exception {
        // Arrange
        KhoVacXinDTO dto = new KhoVacXinDTO();
        dto.setSoLo(1L);
        dto.setTenVacXin("Pfizer");

        when(inventoryService.getAllKhoVacXin()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/inventory/vaccines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].soLo").value(1L))
                .andExpect(jsonPath("$[0].tenVacXin").value("Pfizer"));
    }

    // ==========================================
    // TEST SAVE OR UPDATE VACCINE
    // ==========================================

    @Test
    void saveOrUpdateVaccine_Success() throws Exception {
        // Arrange
        KhoVacXinDTO requestDTO = new KhoVacXinDTO();
        requestDTO.setTenVacXin("AstraZeneca");

        KhoVacXinDTO responseDTO = new KhoVacXinDTO();
        responseDTO.setSoLo(1L);
        responseDTO.setTenVacXin("AstraZeneca");

        when(inventoryService.saveOrUpdateKhoVacXin(any(KhoVacXinDTO.class))).thenReturn(responseDTO);

        // Act & Assert
        mockMvc.perform(post("/api/inventory/vaccines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soLo").value(1L))
                .andExpect(jsonPath("$.tenVacXin").value("AstraZeneca"));
    }

    @Test
    void saveOrUpdateVaccine_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        KhoVacXinDTO requestDTO = new KhoVacXinDTO();
        when(inventoryService.saveOrUpdateKhoVacXin(any(KhoVacXinDTO.class))).thenThrow(new RuntimeException("Lỗi lưu kho"));

        // Act & Assert
        mockMvc.perform(post("/api/inventory/vaccines")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isBadRequest());
    }

    // ==========================================
    // TEST COMBOBOX APIS
    // ==========================================

    @Test
    void getVaccineTypes_Success() throws Exception {
        // Arrange
        LoaiVacXin loai = new LoaiVacXin();
        loai.setMaLoaiVacXin(1L);
        loai.setTenLoaiVacXin("COVID-19");

        when(inventoryService.getAllLoaiVacXin()).thenReturn(List.of(loai));

        // Act & Assert
        mockMvc.perform(get("/api/inventory/vaccine-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenLoaiVacXin").value("COVID-19"));
    }

    @Test
    void getVaccinesList_Success() throws Exception {
        // Arrange
        VacXin vacXin = new VacXin();
        vacXin.setMaVacXin(1L);
        vacXin.setTenVacXin("Verorana");

        when(vacXinRepository.findAllAvailable()).thenReturn(List.of(vacXin));

        // Act & Assert
        mockMvc.perform(get("/api/inventory/vaccine-list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenVacXin").value("Verorana"));
    }

    @Test
    void getSuppliers_Success() throws Exception {
        // Arrange
        NhaCungCap ncc = new NhaCungCap();
        ncc.setMaNhaCungCap(1L);
        ncc.setTenNhaCungCap("VNVC");

        when(nhaCungCapRepository.findByFlagDeleteFalseOrFlagDeleteIsNull()).thenReturn(List.of(ncc));

        // Act & Assert
        mockMvc.perform(get("/api/inventory/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenNhaCungCap").value("VNVC"));
    }

    // ==========================================
    // TEST EXPORT VACCINE & DELETE
    // ==========================================

    @Test
    void exportVaccine_Success() throws Exception {
        // Arrange
        doNothing().when(inventoryService).exportVaccine(1L, 10);

        // Act & Assert
        mockMvc.perform(post("/api/inventory/vaccines/1/export")
                        .param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(content().string("Xuất kho thành công"));
    }

    @Test
    void exportVaccine_OptimisticLockingFailure_ThrowsException() throws Exception {
        // Arrange
        doThrow(new ObjectOptimisticLockingFailureException("LoVacXin", "1"))
                .when(inventoryService).exportVaccine(1L, 10);

        // Act & Assert: Kiểm tra xem lỗi Optimistic Locking có được ném ra ngoài để GlobalExceptionHandler bắt không
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/inventory/vaccines/1/export")
                        .param("quantity", "10"))
        );
    }

    @Test
    void exportVaccine_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Số lượng xuất vượt quá tồn kho!"))
                .when(inventoryService).exportVaccine(1L, 150);

        // Act & Assert
        mockMvc.perform(post("/api/inventory/vaccines/1/export")
                        .param("quantity", "150"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Số lượng xuất vượt quá tồn kho!"));
    }

    @Test
    void deleteVaccine_Success() throws Exception {
        // Arrange
        doNothing().when(inventoryService).deleteKhoVacXin(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/inventory/vaccines/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã xóa mềm Lô Vắc-xin thành công"));
    }

    @Test
    void deleteVaccine_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Không tìm thấy Lô Vắc-xin số: 99"))
                .when(inventoryService).deleteKhoVacXin(99L);

        // Act & Assert
        mockMvc.perform(delete("/api/inventory/vaccines/99"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Không tìm thấy Lô Vắc-xin số: 99"));
    }
}