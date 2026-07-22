package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.config.VNPayConfig;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemDTO;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private BenhNhanService benhNhanService;

    @Value("${vnpay.tmnCode}")
    private String vnp_TmnCode;
    @Value("${vnpay.hashSecret}")
    private String secretKey;
    @Value("${vnpay.url}")
    private String vnp_PayUrl;
    @Value("${vnpay.returnUrl}")
    private String vnp_ReturnUrl;
    @Value("${vnpay.frontendUrl}")
    private String frontendUrl;

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody LichSuTiemDTO dto) {
        // 1. Lưu trạng thái "Chờ thanh toán" và lấy giá tiền
        Double amount = benhNhanService.preparePayment(dto);
        long amountInVND = (long) (amount * 100); // VNPay yêu cầu nhân 100

        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountInVND));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan vacxin " + dto.getRecordId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try {
            for (String fieldName : fieldNames) {
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                            .append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append('&');
                    hashData.append('&');
                }
            }
            query.setLength(query.length() - 1);
            hashData.setLength(hashData.length() - 1);
            String vnp_SecureHash = VNPayConfig.hmacSHA512(secretKey, hashData.toString());
            query.append("&vnp_SecureHash=").append(vnp_SecureHash);

            String paymentUrl = vnp_PayUrl + "?" + query.toString();
            return ResponseEntity.ok(Collections.singletonMap("url", paymentUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo URL thanh toán");
        }
    }

    @GetMapping("/vnpay_return")
    public void paymentReturn(
            @RequestParam("vnp_ResponseCode") String responseCode,
            @RequestParam("vnp_OrderInfo") String orderInfo,
            HttpServletResponse response
    ) throws Exception {
        if ("00".equals(responseCode)) {
            // Thanh toán thành công, parse recordId từ OrderInfo
            String[] parts = orderInfo.split(" ");
            Long recordId = Long.parseLong(parts[parts.length - 1]);

            benhNhanService.confirmPaymentSuccess(recordId);

            // Redirect về màn hình làm việc Frontend kèm thông báo thành công
            response.sendRedirect(frontendUrl + "?payment=success");
        } else {
            response.sendRedirect(frontendUrl + "?payment=failed");
        }
    }
}