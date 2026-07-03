package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.FaqDTO;
import com.vaccine.qltiemchungbackend.entity.LuotTuVan;
import com.vaccine.qltiemchungbackend.repository.LuotTuVanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * SupportService
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Service
public class SupportService {

    @Autowired
    private LuotTuVanRepository luotTuVanRepository;

    /**
     * Lấy danh sách toàn bộ các câu hỏi thường gặp (FAQ).
     *
     * @return List<FaqDTO> Danh sách dữ liệu các câu hỏi thường gặp
     */
    public List<FaqDTO> getAllFaqs() {
        return luotTuVanRepository.findAllFaqs().stream().map(l -> {
            FaqDTO dto = new FaqDTO();
            dto.setId(l.getMaLuotTuVan());
            dto.setQuestion(l.getCauHoi());
            dto.setAnswer(l.getTraLoi());
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Thêm mới hoặc cập nhật một mục câu hỏi thường gặp (FAQ).
     *
     * @param dto Thông tin FAQ gồm ID (nếu có), câu hỏi và câu trả lời
     */
    public void saveFaq(FaqDTO dto) {
        LuotTuVan ltv;
        if (dto.getId() != null) {
            // Chế độ Edit
            ltv = luotTuVanRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi FAQ!"));
        } else {
            // Chế độ Thêm Mới
            ltv = new LuotTuVan();
            ltv.setCauHoiThuongGap(true); // Đánh dấu đây là FAQ chung
            ltv.setFlagDelete(false);
        }

        ltv.setCauHoi(dto.getQuestion());
        ltv.setTraLoi(dto.getAnswer());
        luotTuVanRepository.save(ltv);
    }
}