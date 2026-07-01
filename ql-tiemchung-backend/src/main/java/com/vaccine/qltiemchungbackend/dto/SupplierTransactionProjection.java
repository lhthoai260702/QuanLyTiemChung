package com.vaccine.qltiemchungbackend.dto;

public interface SupplierTransactionProjection {
    String getId();
    String getDate();
    String getVaccineCode();
    Integer getQuantity();
    String getSupplierName();
    Double getPrice();
}