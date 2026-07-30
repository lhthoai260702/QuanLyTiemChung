package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.FaqDTO;
import com.vaccine.qltiemchungbackend.dto.ReminderProjection;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.service.SupportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.projection.ProjectionFactory;
import org.springframework.data.projection.SpelAwareProxyProjectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SupportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Mock
    private SupportService supportService;

    @InjectMocks
    private SupportController supportController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Khởi tạo MockMvc với CharacterEncodingFilter để hỗ trợ Tiếng Việt (UTF-8)
        mockMvc = MockMvcBuilders.standaloneSetup(supportController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST: Lấy danh sách nhắc nhở tiêm chủng
    // ==========================================

    @Test
    void getReminders_Success() throws Exception {
        // Arrange: Dùng Spring Data ProjectionFactory để tạo đối tượng từ Map
        ProjectionFactory factory = new SpelAwareProxyProjectionFactory();

        // Khởi tạo đối tượng giả bằng cách map thẳng các trường cần thiết
        ReminderProjection mockReminder = factory.createProjection(
                ReminderProjection.class,
                Map.of(
                        "id", 1L,
                        "patientName", "Nguyễn Văn A",
                        "vaccineName", "Pfizer"
                )
        );

        // Gắn đối tượng giả vào Repository
        when(chiTietDkTiemRepository.findDanhSachNhacNho()).thenReturn(List.of(mockReminder));

        // Act & Assert
        mockMvc.perform(get("/api/support/reminders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].patientName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$[0].vaccineName").value("Pfizer"));

        verify(chiTietDkTiemRepository, times(1)).findDanhSachNhacNho();
    }

    // ==========================================
    // TEST: Lấy danh sách FAQ
    // ==========================================

    @Test
    void getFaqs_Success() throws Exception {
        // Arrange
        FaqDTO faq1 = new FaqDTO();
        faq1.setId(1L);
        faq1.setQuestion("Vắc-xin có tác dụng phụ gì?");
        faq1.setAnswer("Thường là đau nhẹ ở vết tiêm.");

        when(supportService.getAllFaqs()).thenReturn(List.of(faq1));

        // Act & Assert
        mockMvc.perform(get("/api/support/faqs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].question").value("Vắc-xin có tác dụng phụ gì?"));

        verify(supportService, times(1)).getAllFaqs();
    }

    // ==========================================
    // TEST: Thêm mới FAQ
    // ==========================================

    @Test
    void createFaq_Success() throws Exception {
        // Arrange
        FaqDTO requestDto = new FaqDTO();
        requestDto.setQuestion("Làm sao để đặt lịch?");
        requestDto.setAnswer("Đăng nhập và chọn mục Đăng ký.");

        doNothing().when(supportService).saveFaq(any(FaqDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/support/faqs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Thêm FAQ thành công\"}"));

        verify(supportService, times(1)).saveFaq(any(FaqDTO.class));
    }

    @Test
    void createFaq_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        FaqDTO requestDto = new FaqDTO();
        requestDto.setQuestion("");

        doThrow(new RuntimeException("Lỗi lưu FAQ")).when(supportService).saveFaq(any(FaqDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/support/faqs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi lưu FAQ\"}"));
    }

    // ==========================================
    // TEST: Cập nhật FAQ
    // ==========================================

    @Test
    void updateFaq_Success() throws Exception {
        // Arrange
        FaqDTO requestDto = new FaqDTO();
        requestDto.setQuestion("Câu hỏi đã được sửa?");
        requestDto.setAnswer("Câu trả lời mới.");

        doNothing().when(supportService).saveFaq(any(FaqDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/support/faqs/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Cập nhật FAQ thành công\"}"));

        // Xác minh saveFaq được gọi với DTO có ID là 1
        verify(supportService, times(1)).saveFaq(argThat(dto -> dto.getId().equals(1L)));
    }

    @Test
    void updateFaq_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        FaqDTO requestDto = new FaqDTO();

        doThrow(new RuntimeException("Không tìm thấy FAQ")).when(supportService).saveFaq(any(FaqDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/support/faqs/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Không tìm thấy FAQ\"}"));
    }
}