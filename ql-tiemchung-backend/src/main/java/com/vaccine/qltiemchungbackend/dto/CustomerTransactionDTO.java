package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * CustomerTransactionDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class CustomerTransactionDTO {
    private String id;           // Mã hóa đơn
    private String date;         // Ngày tiêm
    private String vaccineCode;  // Mã vắc xin
    private Integer quantity;    // Số lượng
    private String customerName; // Tên khách hàng
    private Double price;        // Giá thành
}