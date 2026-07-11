package com.cwww.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력입니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "C002", "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "리소스를 찾을 수 없습니다."),
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "C004", "이미 존재하는 리소스입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S001", "서버 오류입니다."),

    // Auth
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "사용자를 찾을 수 없습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "A002", "비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A004", "만료된 토큰입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "A005", "이미 사용 중인 이메일입니다."),
    REREGISTRATION_BLOCKED(HttpStatus.FORBIDDEN, "A006", "탈퇴 후 15일간 재가입이 불가합니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "A007", "이미 사용 중인 닉네임입니다."),

    // Media
    INVALID_FILE_EXTENSION(HttpStatus.BAD_REQUEST, "M001", "허용되지 않는 파일 확장자입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "M002", "파일 크기가 10MB를 초과합니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "M003", "파일 업로드에 실패했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
