package com.vaccine.qltiemchungbackend.dto;

public interface ReminderProjection {
    Long getId();
    Long getPatientId();
    String getPatientName();
    String getExpectedDate();
    String getVaccineName();
    Double getEstimatedPrice();
    String getEmail();
}