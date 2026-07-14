package com.cwww.minihompy.dto.request;

import com.cwww.minihompy.domain.Minihompy;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 미니홈피 설정 변경 요청
 *
 * accessLevel(공개범위), introduction(소개글), mood(기분)를 한 번에 수정.
 * "미니홈피 설정" 모달에서 저장 버튼 하나로 처리되는 흐름에 맞춤.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MinihompySettingsRequest {

    @NotNull
    private Minihompy.AccessLevel accessLevel;
    private String introduction;
    private String mood;

}
