package com.erpqlkho.backend.printing.service;

import com.erpqlkho.backend.common.exception.ApiException;
import com.erpqlkho.backend.printing.entity.PrintedNote;
import com.erpqlkho.backend.printing.repository.PrintedNoteRepository;
import com.erpqlkho.backend.printing.repository.PrintedNoteSummary;
import com.erpqlkho.backend.user.entity.User;
import com.erpqlkho.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrintedNoteService {

    private final PrintedNoteRepository printedNoteRepository;
    private final UserRepository userRepository;

    // Goi tu man hinh Phieu in nhanh KHI bam "Tai phieu in xuong" (khong phai khi chi bam In/xem
    // truoc) - 1 dong moi cho MOI chung tu duoc chon, de 1 chung tu co the co nhieu lan tai.
    @Transactional
    public void recordPrinted(String docType, List<String> docNumbers) {
        if (docNumbers == null || docNumbers.isEmpty()) return;
        User user = currentUser();
        LocalDateTime now = LocalDateTime.now();
        List<PrintedNote> notes = docNumbers.stream().map(docNumber -> {
            PrintedNote note = new PrintedNote();
            note.setDocType(docType);
            note.setDocNumber(docNumber);
            note.setPrintedAt(now);
            note.setPrintedBy(user);
            return note;
        }).toList();
        printedNoteRepository.saveAll(notes);
    }

    // Tra ve map docNumber -> so lan in/lan in gan nhat, CHI cho danh sach docNumbers truyen vao
    // (trang hien tai cua luoi) - dung trong DeliveryOrderService/GoodsIssueService.
    public Map<String, PrintedNoteSummary> summarize(String docType, List<String> docNumbers) {
        if (docNumbers == null || docNumbers.isEmpty()) return Map.of();
        return printedNoteRepository.summarize(docType, docNumbers).stream()
                .collect(Collectors.toMap(PrintedNoteSummary::getDocNumber, s -> s));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay user dang dang nhap"));
    }
}
