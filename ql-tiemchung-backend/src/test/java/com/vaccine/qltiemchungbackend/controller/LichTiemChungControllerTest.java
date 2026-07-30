package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.service.LichTiemChungService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class LichTiemChungControllerTest {

    private MockMvc mockMvc;

    @Mock
    private LichTiemChungService lichTiemChungService;

    @Mock
    private LoaiVacXinRepository loaiVacXinRepository;

    @InjectMocks
    private LichTiemChungController lichTiemChungController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Khởi tạo MockMvc cùng CharacterEncodingFilter để ép chuẩn UTF-8 chống lỗi font tiếng Việt
        mockMvc = MockMvcBuilders.standaloneSetup(lichTiemChungController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST GET ALL SCHEDULES
    // ==========================================

    @Test
    void getAllSchedules_Success() throws Exception {
        // Arrange
        LichTiemChungDTO dto = new LichTiemChungDTO();
        dto.setMaLichTiem("LTC001");
        dto.setDiaDiem("Trung tâm Y tế Quận 1");

        when(lichTiemChungService.getAllSchedules()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/admin/schedules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].maLichTiem").value("LTC001"))
                .andExpect(jsonPath("$[0].diaDiem").value("Trung tâm Y tế Quận 1"));
    }

    // ==========================================
    // TEST GET ALL VACCINE TYPES
    // ==========================================

    @Test
    void getAllVaccineTypes_Success() throws Exception {
        // Arrange
        LoaiVacXin loai = new LoaiVacXin();
        loai.setMaLoaiVacXin(1L);
        loai.setTenLoaiVacXin("COVID-19");

        when(loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull()).thenReturn(List.of(loai));

        // Act & Assert
        mockMvc.perform(get("/api/admin/vaccine-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenLoaiVacXin").value("COVID-19"));
    }

    // ==========================================
    // TEST CREATE SCHEDULE
    // ==========================================

    @Test
    void createSchedule_Success() throws Exception {
        // Arrange
        LichTiemChungDTO request = new LichTiemChungDTO();
        request.setDiaDiem("Hà Nội");

        doNothing().when(lichTiemChungService).createSchedule(any(LichTiemChungDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/admin/schedules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tạo lịch tiêm thành công!"));
    }

    @Test
    void createSchedule_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        LichTiemChungDTO request = new LichTiemChungDTO();
        doThrow(new RuntimeException("Dữ liệu không hợp lệ")).when(lichTiemChungService).createSchedule(any(LichTiemChungDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/admin/schedules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi: Dữ liệu không hợp lệ"));
    }

    // ==========================================
    // TEST UPDATE SCHEDULE
    // ==========================================

    @Test
    void updateSchedule_Success() throws Exception {
        // Arrange
        LichTiemChungDTO request = new LichTiemChungDTO();
        request.setDiaDiem("TP. Hồ Chí Minh");

        doNothing().when(lichTiemChungService).updateSchedule(eq(1L), any(LichTiemChungDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/admin/schedules/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật lịch tiêm thành công!"));
    }

    @Test
    void updateSchedule_OptimisticLockingFailure_ThrowsException() throws Exception {
        // Arrange
        LichTiemChungDTO request = new LichTiemChungDTO();
        doThrow(new ObjectOptimisticLockingFailureException("LichTiemChung", "1"))
                .when(lichTiemChungService).updateSchedule(eq(1L), any(LichTiemChungDTO.class));

        // Act & Assert: Đảm bảo ngoại lệ Optimistic Locking được ném ra để GlobalExceptionHandler xử lý
        assertThrows(Exception.class, () ->
                mockMvc.perform(put("/api/admin/schedules/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        );
    }

    @Test
    void updateSchedule_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        LichTiemChungDTO request = new LichTiemChungDTO();
        doThrow(new RuntimeException("Không tìm thấy lịch tiêm")).when(lichTiemChungService).updateSchedule(eq(1L), any(LichTiemChungDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/admin/schedules/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi: Không tìm thấy lịch tiêm"));
    }

    // ==========================================
    // TEST DELETE SCHEDULE
    // ==========================================

    @Test
    void deleteSchedule_Success() throws Exception {
        // Arrange
        doNothing().when(lichTiemChungService).deleteSchedule(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/admin/schedules/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa lịch tiêm thành công!"));
    }

    @Test
    void deleteSchedule_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Không tìm thấy lịch tiêm")).when(lichTiemChungService).deleteSchedule(99L);

        // Act & Assert
        mockMvc.perform(delete("/api/admin/schedules/99"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi: Không tìm thấy lịch tiêm"));
    }
}