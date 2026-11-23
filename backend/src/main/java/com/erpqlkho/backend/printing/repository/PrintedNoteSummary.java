package com.erpqlkho.backend.printing.repository;

import java.time.LocalDateTime;

// Projection cho PrintedNoteRepository.summarize() - so lan in + lan in gan nhat cua 1 doc_number,
// dung de hien cot "Number Of Prints"/"Last Printing Time" tren luoi Phieu in nhanh.
public interface PrintedNoteSummary {
    String getDocNumber();
    Long getPrintCount();
    LocalDateTime getLastPrintedAt();
}
