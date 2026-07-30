package com.vaccine.qltiemchungbackend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bắt lỗi Optimistic Locking khi có nhiều người cập nhật cùng một bản ghi đồng thời.
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<String> handleOptimisticLockingFailure(ObjectOptimisticLockingFailureException ex) {

        // 1. Gán message mặc định (phòng trường hợp không xác định được Entity)
        String message = "Dữ liệu đang được thao tác bởi một người khác. Vui lòng tải lại trang và thử lại!";

        // 2. Lấy thông tin lỗi an toàn
        String exceptionDetails = "";

        if (ex.getPersistentClass() != null) {
            exceptionDetails = ex.getPersistentClass().getSimpleName();
        } else if (ex.getMessage() != null) {
            exceptionDetails = ex.getMessage(); // Lấy message có chứa tên lớp (vd: ...entity.LoVacXin#1)
        }

        // 3. Phân tích nội dung lỗi để trả về câu thông báo thân thiện
        if (exceptionDetails.contains("LoVacXin")) {
            message = "Lỗi: Số lượng tồn kho của Lô vắc-xin này vừa bị thay đổi bởi người khác. Vui lòng tải lại trang và kiểm tra lại tồn kho!";
        } else if (exceptionDetails.contains("LichTiemChung")) {
            message = "Lỗi: Lịch tiêm này vừa có người đăng ký chốt slot cuối. Vui lòng chọn lịch tiêm hoặc vắc xin khác!";
        }

        // 4. Trả về Frontend kèm HTTP Status 409 (Conflict)
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("{\"error\": \"" + message + "\"}");
    }
}