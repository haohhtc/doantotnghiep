package com.erpqlkho.backend.printing.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

// Body cua POST /api/printed-notes - ghi nhan 1 lan tai phieu in xuong cho N chung tu cung loai
// (nguoi dung co the chon nhieu dong tren luoi Phieu in nhanh roi tai 1 lan).
@Getter
@Setter
public class PrintedNoteRequest {
    private String docType;
    private List<String> docNumbers;
}
