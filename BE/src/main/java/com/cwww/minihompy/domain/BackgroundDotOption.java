package com.cwww.minihompy.domain;

import lombok.Getter;

// 기본 도트(땡땡이) 배경 색상 선택지 (고정)
@Getter
public enum BackgroundDotOption {

    // 색 정의 (고정), 하나 선택 가능
    RED("RED", "#FF6B6B"),
    ORANGE("ORANGE", "#FFA94D"),
    YELLOW("YELLOW", "#FFD43B"),
    GREEN("GREEN", "#69DB7C"),
    BLUE("BLUE", "#4DABF7"),
    PURPLE("PURPLE", "#B197FC");

    private final String code; // 색상 이름
    private final String hex; // 색상 hex 코드

    BackgroundDotOption(String code, String hex) {

        this.code = code;
        this.hex = hex;

    }

    // 문자열로 코드를 받아서 그에 해당하는 enum 값을 찾아준다
    public static BackgroundDotOption fromCode(String code) {

        for(BackgroundDotOption option : values()) {

            if(option.code.equals(code)) {
                return option;
            }

        }

        return null;

    }

}
