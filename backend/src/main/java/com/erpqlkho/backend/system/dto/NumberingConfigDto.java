package com.erpqlkho.backend.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NumberingConfigDto {

    // Chi cho sua prefix - KHONG cho sua current_sequence truc tiep (tranh nhay so/trung so,
    // doc_number dang co rang buoc UNIQUE) - xem tonghop.md.
    @NotBlank(message = "Tien to khong duoc de trong")
    private String prefix;
}
