package com.vaccine.qltiemchungbackend.dto;
import lombok.Data;

@Data
public class CustomerTransactionDTO {
    private String id;           // Mã hóa đơn
    private String date;         // Ngày tiêm
    private String vaccineCode;  // Mã vắc xin
    private Integer quantity;    // Số lượng
    private String customerName; // Tên khách hàng
    private Double price;        // Giá thành
}