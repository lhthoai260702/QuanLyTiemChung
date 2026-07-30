package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.BenhNhanDTO;
import com.vaccine.qltiemchungbackend.dto.KeDonRequestDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemDTO;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.TaiKhoanService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MedicalControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BenhNhanService benhNhanService;

    @Mock
    private VacXinRepository vacXinRepository;

    @Mock
    private LoVacXinRepository loVacXinRepository;

    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Mock
    private BenhNhanRepository benhNhanRepository;

    @Mock
    private TaiKhoanService taiKhoanService;

    @InjectMocks
    private MedicalController medicalController;

    // Đã cấu hình thêm JavaTimeModule để parse được kiểu LocalDate
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @BeforeEach
    void setUp() {
        // Khởi tạo MockMvc cùng CharacterEncodingFilter để ép chuẩn UTF-8 chống lỗi font tiếng Việt
        mockMvc = MockMvcBuilders.standaloneSetup(medicalController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST GET ALL PATIENTS
    // ==========================================

    @Test
    void getAllPatients_Success() throws Exception {
        // Arrange
        BenhNhanDTO dto = new BenhNhanDTO();
        dto.setId("1");
        dto.setFullName("Nguyen Van A");

        when(benhNhanService.getAllPatients()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/medical/patients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("1"))
                .andExpect(jsonPath("$[0].fullName").value("Nguyen Van A"));
    }

    // ==========================================
    // TEST UPDATE PATIENT
    // ==========================================

    @Test
    void updatePatient_Success() throws Exception {
        // Arrange
        BenhNhanDTO request = new BenhNhanDTO();
        request.setFullName("Nguyen Van A Updated");

        doNothing().when(benhNhanService).updatePatient(eq(1L), any(BenhNhanDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/medical/patients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Cập nhật hồ sơ thành công!"));
    }

    @Test
    void updatePatient_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        BenhNhanDTO request = new BenhNhanDTO();
        doThrow(new RuntimeException("Không tìm thấy bệnh nhân")).when(benhNhanService).updatePatient(eq(1L), any(BenhNhanDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/medical/patients/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Lỗi: Không tìm thấy bệnh nhân"));
    }

    // ==========================================
    // TEST GET VACCINES FOR COMBOBOX
    // ==========================================

    @Test
    void getVaccinesForCombobox_Success() throws Exception {
        // Arrange
        VacXin vacXin = new VacXin();
        vacXin.setMaVacXin(1L);
        vacXin.setTenVacXin("Pfizer");

        when(vacXinRepository.findAllAvailable()).thenReturn(List.of(vacXin));

        // Act & Assert
        mockMvc.perform(get("/api/medical/vaccines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("Pfizer"));
    }

    // ==========================================
    // TEST PRESCRIBE VACCINE
    // ==========================================

    @Test
    void prescribeVaccine_Success() throws Exception {
        // Arrange
        KeDonRequestDTO request = new KeDonRequestDTO();
        request.setPatientId(1L);
        request.setVaccineId(1L);
        request.setDate(LocalDate.of(2026, 8, 1));
        request.setTime("09:00");
        request.setGhiChu("Tiêm mũi 1");

        BenhNhan mockBenhNhan = new BenhNhan();
        mockBenhNhan.setMaBenhNhan(1L);

        LoVacXin mockLoVacXin = new LoVacXin();
        mockLoVacXin.setMaLo(10L);

        when(benhNhanRepository.findById(1L)).thenReturn(Optional.of(mockBenhNhan));
        when(loVacXinRepository.findAvailableLotByVaccineId(1L)).thenReturn(Optional.of(mockLoVacXin));
        when(chiTietDkTiemRepository.save(any(ChiTietDkTiem.class))).thenReturn(new ChiTietDkTiem());

        // Act & Assert
        mockMvc.perform(post("/api/medical/prescribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Kê đơn và lên lịch thành công!"));
    }

    @Test
    void prescribeVaccine_PatientNotFound_ReturnsBadRequest() throws Exception {
        // Arrange
        KeDonRequestDTO request = new KeDonRequestDTO();
        request.setPatientId(99L);
        request.setVaccineId(1L);

        when(benhNhanRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/medical/prescribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Không tìm thấy bệnh nhân!"));
    }

    // ==========================================
    // TEST UPDATE HISTORY RECORD
    // ==========================================

    @Test
    void updateHistoryRecord_Success() throws Exception {
        // Arrange
        LichSuTiemDTO request = new LichSuTiemDTO();
        request.setStatus("Đã tiêm");
        request.setGhiChu("Theo dõi 30 phút sau tiêm bình thường");

        doNothing().when(benhNhanService).updateHistoryRecord(eq(1L), any(LichSuTiemDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/medical/history/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Cập nhật lịch sử tiêm thành công!"));

        verify(benhNhanService, times(1)).updateHistoryRecord(eq(1L), any(LichSuTiemDTO.class));
    }

    @Test
    void updateHistoryRecord_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        LichSuTiemDTO request = new LichSuTiemDTO();
        doThrow(new RuntimeException("Lỗi cập nhật")).when(benhNhanService).updateHistoryRecord(eq(1L), any(LichSuTiemDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/medical/history/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Lỗi: Lỗi cập nhật"));
    }

    // ==========================================
    // TEST DELETE HISTORY RECORD
    // ==========================================

    @Test
    void deleteHistoryRecord_Success() throws Exception {
        // Arrange
        doNothing().when(benhNhanService).deleteHistoryRecord(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/medical/history/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã xóa lịch sử tiêm thành công!"));
    }

    @Test
    void deleteHistoryRecord_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        doThrow(new RuntimeException("Không tìm thấy bản ghi")).when(benhNhanService).deleteHistoryRecord(99L);

        // Act & Assert
        mockMvc.perform(delete("/api/medical/history/99"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Lỗi: Không tìm thấy bản ghi"));
    }

    // ==========================================
    // TEST CREATE PATIENT ACCOUNT
    // ==========================================

    @Test
    void createPatientAccount_Success() throws Exception {
        // Arrange
        AccountCreationDTO request = new AccountCreationDTO();
        // Sửa TẠI ĐÂY: Sử dụng setTenDangNhap thay vì setUsername để khớp với AccountCreationDTO
        request.setTenDangNhap("patient01");

        doNothing().when(taiKhoanService).createAccount(any(AccountCreationDTO.class));

        // Act & Assert - Kiểm tra JSON bằng String raw để tránh lỗi text/plain mismatch
        mockMvc.perform(post("/api/medical/patients/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Tạo hồ sơ bệnh nhân thành công!\"}"));
    }

    @Test
    void createPatientAccount_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        AccountCreationDTO request = new AccountCreationDTO();
        doThrow(new RuntimeException("Tên đăng nhập đã tồn tại")).when(taiKhoanService).createAccount(any(AccountCreationDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/medical/patients/account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi: Tên đăng nhập đã tồn tại\"}"));
    }
}