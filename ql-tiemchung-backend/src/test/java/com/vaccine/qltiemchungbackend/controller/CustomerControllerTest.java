package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.entity.PhanHoi;
import com.vaccine.qltiemchungbackend.entity.PhanHoiCC;
import com.vaccine.qltiemchungbackend.repository.DichBenhRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiCCRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.CustomerService;
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
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.*;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VacXinRepository vacXinRepository;
    @Mock
    private CustomerService customerService;
    @Mock
    private BenhNhanService benhNhanService;
    @Mock
    private DichBenhRepository dichBenhRepository;
    @Mock
    private PhanHoiRepository phanHoiRepository;
    @Mock
    private PhanHoiCCRepository phanHoiCCRepository;
    @Mock
    private SupportService supportService;

    @InjectMocks
    private CustomerController customerController;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ProjectionFactory factory = new SpelAwareProxyProjectionFactory();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST VACCINES & DISEASES
    // ==========================================
    @Test
    void getVaccinesCatalog_Success() throws Exception {
        Map<String, Object> backingMap = new HashMap<>();
        backingMap.put("tenVacXin", "AstraZeneca");
        CustomerVaccineProjection mockProj = factory.createProjection(CustomerVaccineProjection.class, backingMap);

        when(vacXinRepository.findAllVaccinesForCustomer()).thenReturn(List.of(mockProj));

        mockMvc.perform(get("/api/customer/vaccines"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenVacXin").value("AstraZeneca"));
    }

    @Test
    void getDiseasesInfo_Success() throws Exception {
        Map<String, Object> backingMap = new HashMap<>();
        backingMap.put("tenDichBenh", "Covid-19");
        DichBenhProjection mockProj = factory.createProjection(DichBenhProjection.class, backingMap);

        when(dichBenhRepository.findAllDichBenh()).thenReturn(List.of(mockProj));

        mockMvc.perform(get("/api/customer/diseases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenDichBenh").value("Covid-19"));
    }

    // ==========================================
    // TEST BOOKING
    // ==========================================
    @Test
    void bookVaccine_Success() throws Exception {
        BookingRequestDTO request = new BookingRequestDTO();
        doNothing().when(customerService).bookVaccine(any(BookingRequestDTO.class));

        mockMvc.perform(post("/api/customer/book")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng ký tiêm phòng thành công!"));
    }

    @Test
    void bookVaccine_Failure_ReturnsBadRequest() throws Exception {
        BookingRequestDTO request = new BookingRequestDTO();
        doThrow(new RuntimeException("Lỗi hệ thống")).when(customerService).bookVaccine(any(BookingRequestDTO.class));

        mockMvc.perform(post("/api/customer/book")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi hệ thống"));
    }

    @Test
    void bookVaccine_OptimisticLockingFailure_ThrowsException() throws Exception {
        BookingRequestDTO request = new BookingRequestDTO();
        doThrow(new ObjectOptimisticLockingFailureException("VacXin", "1"))
                .when(customerService).bookVaccine(any(BookingRequestDTO.class));

        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/customer/book")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        );
    }

    // ==========================================
    // TEST PROFILE
    // ==========================================
    @Test
    void getMyProfile_Success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("testuser", "password");
        BenhNhanDTO mockProfile = new BenhNhanDTO();
        mockProfile.setFullName("Nguyen Van A");
        mockProfile.setEmail("nguyenvana@gmail.com");

        when(benhNhanService.getPatientByUsername("testuser")).thenReturn(mockProfile);

        mockMvc.perform(get("/api/customer/profile").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.email").value("nguyenvana@gmail.com"));
    }

    @Test
    void updateMyProfile_Success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("testuser", "password");
        BenhNhanDTO request = new BenhNhanDTO();
        request.setFullName("Nguyen Van A Updated");
        doNothing().when(benhNhanService).updatePatientByUsername(anyString(), any(BenhNhanDTO.class));

        mockMvc.perform(put("/api/customer/profile")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật hồ sơ thành công!"));
    }

    @Test
    void updateMyProfile_Failure_ReturnsBadRequest() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("testuser", "password");
        BenhNhanDTO request = new BenhNhanDTO();
        doThrow(new RuntimeException("Lỗi cập nhật")).when(benhNhanService).updatePatientByUsername(anyString(), any(BenhNhanDTO.class));

        mockMvc.perform(put("/api/customer/profile")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi cập nhật"));
    }

    // ==========================================
    // TEST FAQS
    // ==========================================
    @Test
    void getCustomerFaqs_Success() throws Exception {
        FaqDTO faq = new FaqDTO();
        faq.setQuestion("Câu hỏi 1");
        when(supportService.getAllFaqs()).thenReturn(List.of(faq));

        mockMvc.perform(get("/api/customer/faqs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].question").value("Câu hỏi 1"));
    }

    // ==========================================
    // TEST FEEDBACK CREATION
    // ==========================================
    @Test
    void submitNormalFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setMaBenhNhan(1L);
        request.setNormalContent("Dịch vụ rất tốt");
        request.setTime("2026-07-13");

        mockMvc.perform(post("/api/customer/feedback/normal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Gửi thành công"));

        verify(phanHoiRepository, times(1)).save(any(PhanHoi.class));
    }

    @Test
    void submitNormalFeedback_Failure() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setTime("Invalid-Date-Format");

        mockMvc.perform(post("/api/customer/feedback/normal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Gửi thất bại"));
    }

    @Test
    void submitHighLevelFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setHighLevelType("Phàn nàn");
        request.setHighLevelContent("Góp ý hệ thống");

        mockMvc.perform(post("/api/customer/feedback/high-level")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Phản hồi gửi đi thành công."));

        verify(phanHoiCCRepository, times(1)).save(any(PhanHoiCC.class));
    }

    @Test
    void submitHighLevelFeedback_Failure() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        when(phanHoiCCRepository.save(any(PhanHoiCC.class))).thenThrow(new RuntimeException("DB Error"));

        mockMvc.perform(post("/api/customer/feedback/high-level")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Phản hồi gửi thất bại"));
    }

    // ==========================================
    // TEST FEEDBACK REPLY & RESOLVE
    // ==========================================
    @Test
    void replyFeedback_NormalFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setFeedbackId("PH-1");
        request.setSender("customer");
        request.setReplyContent("Cảm ơn");

        PhanHoi mockPhanHoi = new PhanHoi();
        mockPhanHoi.setChiTietPhanHoi("[]");

        when(phanHoiRepository.findById(1L)).thenReturn(Optional.of(mockPhanHoi));

        mockMvc.perform(post("/api/customer/feedback/reply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Gửi tin nhắn thành công"));
    }

    @Test
    void replyFeedback_HighLevelFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setFeedbackId("PHCC-2");
        request.setSender("admin");
        request.setReplyContent("Đã ghi nhận");

        PhanHoiCC mockPhanHoiCC = new PhanHoiCC();
        mockPhanHoiCC.setChiTietPhanHoi("[]");

        when(phanHoiCCRepository.findById(2L)).thenReturn(Optional.of(mockPhanHoiCC));

        mockMvc.perform(post("/api/customer/feedback/reply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Gửi tin nhắn thành công"));
    }

    @Test
    void replyFeedback_Failure_NotFound() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setFeedbackId("PH-99");
        when(phanHoiRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/customer/feedback/reply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi gửi tin nhắn"));
    }

    @Test
    void resolveFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setNormalContent("Câu trả lời");

        PhanHoi ph = new PhanHoi();
        ph.setChiTietPhanHoi("[]");
        when(phanHoiRepository.findById(1L)).thenReturn(Optional.of(ph));

        mockMvc.perform(post("/api/customer/feedback/resolve/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Giải đáp thành công"));
    }

    @Test
    void resolveHighLevelFeedback_Success() throws Exception {
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setNormalContent("Câu trả lời CC");

        PhanHoiCC phcc = new PhanHoiCC();
        phcc.setChiTietPhanHoi("[]");
        when(phanHoiCCRepository.findById(2L)).thenReturn(Optional.of(phcc));

        mockMvc.perform(post("/api/customer/admin/feedback/high-level/resolve/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Giải đáp phản hồi cấp cao thành công"));
    }

    // ==========================================
    // TEST FEEDBACK COMPLETE
    // ==========================================
    @Test
    void completeFeedback_Normal_Success() throws Exception {
        PhanHoi ph = new PhanHoi();
        when(phanHoiRepository.findById(1L)).thenReturn(Optional.of(ph));

        mockMvc.perform(put("/api/customer/feedback/complete/PH-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã đánh dấu hoàn thành"));
    }

    @Test
    void completeFeedback_HighLevel_Success() throws Exception {
        PhanHoiCC phcc = new PhanHoiCC();
        when(phanHoiCCRepository.findById(2L)).thenReturn(Optional.of(phcc));

        mockMvc.perform(put("/api/customer/feedback/complete/PHCC-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã đánh dấu hoàn thành"));
    }

    @Test
    void completeFeedback_Failure() throws Exception {
        when(phanHoiRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/customer/feedback/complete/PH-99"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Lỗi cập nhật trạng thái"));
    }

    // ==========================================
    // TEST GET FEEDBACK LISTS
    // ==========================================
    @Test
    void getFeedbackList_Success() throws Exception {
        Map<String, Object> backingMap = new HashMap<>();
        backingMap.put("id", 1L);
        backingMap.put("customerName", "Nguyen A");
        backingMap.put("status", "Đang xử lý");
        PhanHoiProjection mockProj = factory.createProjection(PhanHoiProjection.class, backingMap);

        when(phanHoiRepository.layDanhSachPhanHoiProjection()).thenReturn(List.of(mockProj));
        when(phanHoiRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/customer/feedback/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerName").value("Nguyen A"));
    }

    @Test
    void getAllHighLevelFeedbacks_Success() throws Exception {
        // Sử dụng Collections.singletonList để đúng kiểu List<Object[]> trả về từ repositoryCC
        Object[] row = new Object[]{1L, "Nguyen A", "Noi dung", "testuser@gmail.com", "Khieu Nai", "Da tra loi", "---"};
        when(phanHoiCCRepository.layTatCaPhanHoiCC()).thenReturn(Collections.singletonList(row));
        when(phanHoiCCRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/customer/admin/feedback/high-level"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("PHCC-1"))
                .andExpect(jsonPath("$[0].customerName").value("Nguyen A"))
                .andExpect(jsonPath("$[0].email").value("testuser@gmail.com"));
    }

    @Test
    void getMyFeedbacks_Success() throws Exception {
        // Sử dụng Collections.singletonList cho cả 2 danh sách Object[]
        Object[] rowNormal = new Object[]{1L, "Content 1", "Reply 1", "2026-07-13"};
        Object[] rowHigh = new Object[]{2L, "Content CC", "Reply CC"};

        when(phanHoiRepository.layDanhSachPhanHoiTheoBenhNhan(10L)).thenReturn(Collections.singletonList(rowNormal));
        when(phanHoiCCRepository.layDanhSachPhanHoiCCTheoBenhNhan(10L)).thenReturn(Collections.singletonList(rowHigh));

        PhanHoi ph = new PhanHoi();
        ph.setTrangThai("Đã hoàn thành");
        ph.setChiTietPhanHoi("[{\"msg\": \"test\"}]");
        when(phanHoiRepository.findById(1L)).thenReturn(Optional.of(ph));
        when(phanHoiCCRepository.findById(2L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/customer/my-feedbacks/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("PH-1"))
                .andExpect(jsonPath("$[0].status").value("Đã hoàn thành"))
                .andExpect(jsonPath("$[0].type").value("Thường"))
                .andExpect(jsonPath("$[1].id").value("PHCC-2"))
                .andExpect(jsonPath("$[1].status").value("Đang chờ"))
                .andExpect(jsonPath("$[1].type").value("Cấp cao"));
    }
}