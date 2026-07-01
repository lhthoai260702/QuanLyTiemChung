package com.vaccine.qltiemchungbackend.dto;

public interface CustomerTransactionProjection {
    String getId();
    String getDate();
    String getVaccineCode();
    Integer getQuantity();
    String getCustomerName();
    Double getPrice();
}