package com.erpqlkho.backend.printing.controller;

import com.erpqlkho.backend.common.response.ApiResponse;
import com.erpqlkho.backend.printing.dto.PrintedNoteRequest;
import com.erpqlkho.backend.printing.service.PrintedNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/printed-notes")
@RequiredArgsConstructor
public class PrintedNoteController {

    private final PrintedNoteService printedNoteService;

    // Man hinh Phieu in nhanh goi KHI bam "Tai phieu in xuong" (khong goi khi chi bam In/xem truoc).
    @PostMapping
    public ApiResponse<Void> record(@RequestBody PrintedNoteRequest request) {
        printedNoteService.recordPrinted(request.getDocType(), request.getDocNumbers());
        return ApiResponse.ok("Da ghi nhan tai phieu in", null);
    }
}
