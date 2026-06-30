package com.vaccine.qltiemchungbackend.dto;
import lombok.Data;

@Data
public class FaqDTO {
    private Long id;
    private String question;
    private String answer;
}