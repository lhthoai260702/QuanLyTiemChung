package com.vaccine.qltiemchungbackend.dto;
import lombok.Data;

@Data
public class SupplierTransactionDTO {
    private String id;
    private String date;
    private String vaccineCode;
    private Integer quantity;
    private String supplierName;
    private Double price;
}