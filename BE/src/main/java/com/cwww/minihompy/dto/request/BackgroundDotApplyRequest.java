package com.cwww.minihompy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BackgroundDotApplyRequest {

    @NotBlank
    private String code; // BackgroundDotOption의 code (예: "RED")

}
