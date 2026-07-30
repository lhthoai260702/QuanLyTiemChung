package com.vaccine.qltiemchungbackend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler globalExceptionHandler;

    // Tạo các class giả lập (Dummy classes) để test hàm ex.getPersistentClass()
    private static class LoVacXin {
    }

    private static class LichTiemChung {
    }

    private static class NhanVien {
    }

    @BeforeEach
    void setUp() {
        globalExceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleOptimisticLockingFailure_WithLoVacXinClass_ReturnsInventoryMessage() {
        // Arrange: Giả lập lỗi xảy ra trên Entity LoVacXin (Nhận diện qua Persistent Class)
        ObjectOptimisticLockingFailureException ex = Mockito.mock(ObjectOptimisticLockingFailureException.class);
        Mockito.doReturn(LoVacXin.class).when(ex).getPersistentClass();

        // Act
        ResponseEntity<String> response = globalExceptionHandler.handleOptimisticLockingFailure(ex);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().contains("Số lượng tồn kho của Lô vắc-xin này vừa bị thay đổi bởi người khác"));
    }

    @Test
    void handleOptimisticLockingFailure_WithLichTiemChungMessage_ReturnsScheduleMessage() {
        // Arrange: Giả lập lỗi trên LichTiemChung nhưng Class bị null, chỉ nhận diện được qua Message
        ObjectOptimisticLockingFailureException ex = Mockito.mock(ObjectOptimisticLockingFailureException.class);
        when(ex.getPersistentClass()).thenReturn(null);
        when(ex.getMessage()).thenReturn("Row was updated or deleted by another transaction (or unsaved-value mapping was incorrect) : [com.vaccine.entity.LichTiemChung#1]");

        // Act
        ResponseEntity<String> response = globalExceptionHandler.handleOptimisticLockingFailure(ex);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().contains("Lịch tiêm này vừa có người đăng ký chốt slot cuối"));
    }

    @Test
    void handleOptimisticLockingFailure_WithUnknownClass_ReturnsDefaultMessage() {
        // Arrange: Giả lập lỗi trên một Entity khác không nằm trong danh sách kiểm tra (vd: NhanVien)
        ObjectOptimisticLockingFailureException ex = Mockito.mock(ObjectOptimisticLockingFailureException.class);
        Mockito.doReturn(NhanVien.class).when(ex).getPersistentClass();

        // Act
        ResponseEntity<String> response = globalExceptionHandler.handleOptimisticLockingFailure(ex);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().contains("Dữ liệu đang được thao tác bởi một người khác"));
    }

    @Test
    void handleOptimisticLockingFailure_WithNullDetails_ReturnsDefaultMessage() {
        // Arrange: Giả lập trường hợp lỗi trả về mọi thông tin đều bị Null
        ObjectOptimisticLockingFailureException ex = Mockito.mock(ObjectOptimisticLockingFailureException.class);
        when(ex.getPersistentClass()).thenReturn(null);
        when(ex.getMessage()).thenReturn(null);

        // Act
        ResponseEntity<String> response = globalExceptionHandler.handleOptimisticLockingFailure(ex);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody().contains("Dữ liệu đang được thao tác bởi một người khác"));
        // Kiểm tra đúng định dạng JSON
        assertTrue(response.getBody().startsWith("{\"error\":"));
    }
}