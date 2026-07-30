package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.FaqDTO;
import com.vaccine.qltiemchungbackend.entity.LuotTuVan;
import com.vaccine.qltiemchungbackend.repository.LuotTuVanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportServiceTest {

    @Mock
    private LuotTuVanRepository luotTuVanRepository;

    @InjectMocks
    private SupportService supportService;

    private LuotTuVan mockLuotTuVan;
    private FaqDTO mockDTO;

    @BeforeEach
    void setUp() {
        // Khởi tạo Entity giả lập
        mockLuotTuVan = new LuotTuVan();
        mockLuotTuVan.setMaLuotTuVan(1L);
        mockLuotTuVan.setCauHoi("Tiêm vắc-xin có đau không?");
        mockLuotTuVan.setTraLoi("Thường chỉ đau nhẹ ở vị trí tiêm.");
        mockLuotTuVan.setCauHoiThuongGap(true);
        mockLuotTuVan.setFlagDelete(false);

        // Khởi tạo DTO giả lập
        mockDTO = new FaqDTO();
        mockDTO.setQuestion("Tiêm vắc-xin có đau không?");
        mockDTO.setAnswer("Thường chỉ đau nhẹ ở vị trí tiêm.");
    }

    @Test
    void getAllFaqs_ReturnsList() {
        // Arrange
        when(luotTuVanRepository.findAllFaqs()).thenReturn(List.of(mockLuotTuVan));

        // Act
        List<FaqDTO> results = supportService.getAllFaqs();

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        FaqDTO dto = results.get(0);
        assertEquals(1L, dto.getId());
        assertEquals("Tiêm vắc-xin có đau không?", dto.getQuestion());
        assertEquals("Thường chỉ đau nhẹ ở vị trí tiêm.", dto.getAnswer());

        verify(luotTuVanRepository, times(1)).findAllFaqs();
    }

    @Test
    void saveFaq_CreateNew_Success() {
        // Arrange: ID null nghĩa là tạo mới
        mockDTO.setId(null);

        // Act
        supportService.saveFaq(mockDTO);

        // Assert
        // Xác minh xem repository.save() có được gọi 1 lần với bất kỳ đối tượng LuotTuVan nào hay không
        verify(luotTuVanRepository, times(1)).save(any(LuotTuVan.class));
    }

    @Test
    void saveFaq_UpdateExisting_Success() {
        // Arrange: Cập nhật FAQ với ID = 1L
        mockDTO.setId(1L);
        mockDTO.setQuestion("Câu hỏi đã được update?");
        mockDTO.setAnswer("Câu trả lời đã update.");

        when(luotTuVanRepository.findById(1L)).thenReturn(Optional.of(mockLuotTuVan));

        // Act
        supportService.saveFaq(mockDTO);

        // Assert
        assertEquals("Câu hỏi đã được update?", mockLuotTuVan.getCauHoi());
        assertEquals("Câu trả lời đã update.", mockLuotTuVan.getTraLoi());

        verify(luotTuVanRepository, times(1)).findById(1L);
        verify(luotTuVanRepository, times(1)).save(mockLuotTuVan);
    }

    @Test
    void saveFaq_UpdateExisting_NotFound_ThrowsException() {
        // Arrange: Cố gắng cập nhật ID = 99L (Không tồn tại)
        mockDTO.setId(99L);
        when(luotTuVanRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> supportService.saveFaq(mockDTO));

        assertEquals("Không tìm thấy câu hỏi FAQ!", exception.getMessage());

        // Đảm bảo không có hành động lưu nào được thực thi
        verify(luotTuVanRepository, never()).save(any());
    }
}