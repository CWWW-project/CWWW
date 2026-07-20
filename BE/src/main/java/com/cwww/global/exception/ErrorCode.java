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
    EMAIL_NOT_FOUND(HttpStatus.NOT_FOUND, "A014", "존재하지 않는 이메일입니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "A002", "비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A004", "만료된 토큰입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "A005", "이미 사용 중인 이메일입니다."),
    REREGISTRATION_BLOCKED(HttpStatus.FORBIDDEN, "A006", "탈퇴 후 15일간 재가입이 불가합니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "A007", "이미 사용 중인 닉네임입니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "A008", "이메일 인증이 완료되지 않았습니다."),
    INVALID_VERIFICATION_CODE(HttpStatus.BAD_REQUEST, "A009", "인증 코드가 유효하지 않습니다."),
    MAIL_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "A010", "이메일 발송에 실패했습니다."),
    OAUTH_CODE_INVALID(HttpStatus.BAD_REQUEST, "A011", "유효하지 않거나 만료된 OAuth 코드입니다."),
    INVALID_RESET_TOKEN(HttpStatus.BAD_REQUEST, "A012", "유효하지 않은 재설정 토큰입니다."),
    EXPIRED_RESET_TOKEN(HttpStatus.BAD_REQUEST, "A013", "만료된 재설정 토큰입니다."),
    SOCIAL_LOGIN_REQUIRED(HttpStatus.CONFLICT, "A015", "소셜 로그인으로 가입된 계정이에요. '구글로 시작하기' 또는 'GitHub으로 시작하기'를 이용해주세요."),


    // Media
    INVALID_FILE_EXTENSION(HttpStatus.BAD_REQUEST, "M001", "허용되지 않는 파일 확장자입니다."),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "M002", "파일 크기가 10MB를 초과합니다."),
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "M003", "파일 업로드에 실패했습니다."),

    // Redis
    REDIS_PUBLISH_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "R001", "Redis 메시지 발행에 실패했습니다."),
    REDIS_SUBSCRIBE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "R002", "Redis 메시지 처리에 실패했습니다."),

    // Post
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "P001", "게시글을 찾을 수 없습니다."),
    POST_FORBIDDEN(HttpStatus.FORBIDDEN, "P002", "게시글에 대한 권한이 없습니다."),
    ALREADY_LIKED(HttpStatus.CONFLICT, "P003", "이미 좋아요한 게시글입니다."),
    NOT_LIKED(HttpStatus.BAD_REQUEST, "P004", "좋아요하지 않은 게시글입니다."),
    ALREADY_BOOKMARKED(HttpStatus.CONFLICT, "P005", "이미 북마크한 게시글입니다."),
    NOT_BOOKMARKED(HttpStatus.BAD_REQUEST, "P006", "북마크하지 않은 게시글입니다."),

    // Comment
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "C101", "댓글을 찾을 수 없습니다."),
    COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "C102", "댓글에 대한 권한이 없습니다."),
    COMMENT_REPLY_DEPTH_EXCEEDED(HttpStatus.BAD_REQUEST, "C103", "대댓글에는 답글을 달 수 없습니다."),

    // Friend
    ALREADY_FRIEND(HttpStatus.CONFLICT, "F001", "이미 일촌 관계입니다."),
    FRIEND_REQUEST_ALREADY_RECEIVED(HttpStatus.CONFLICT, "F005", "상대방이 이미 일촌 신청을 보냈습니다. 일촌 신청 목록에서 수락해주세요."),
    FRIEND_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "F002", "일촌 신청을 찾을 수 없습니다."),
    FRIEND_NOT_FOUND(HttpStatus.NOT_FOUND, "F003", "일촌 관계를 찾을 수 없습니다."),
    FRIEND_FORBIDDEN(HttpStatus.FORBIDDEN, "F004", "일촌 요청에 대한 권한이 없습니다."),

    // Chat
    PRIVATE_CHAT_ROOM_ALREADY_EXISTS(HttpStatus.CONFLICT, "CH001", "이미 1:1 채팅방이 존재합니다."),

    // Minihompy
    MINIHOMPY_NOT_FOUND(HttpStatus.NOT_FOUND, "H001", "미니홈피를 찾을 수 없습니다."),
    MINIHOMPY_FORBIDDEN(HttpStatus.FORBIDDEN, "H002", "미니홈피에 대한 접근 권한이 없습니다."),
    PROFILE_IMAGE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "H003", "파일 크기가 10MB를 초과합니다."),

    // Guestbook
    GUESTBOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "H004", "방명록을 찾을 수 없습니다."),
    GUESTBOOK_FORBIDDEN(HttpStatus.FORBIDDEN, "H005", "방명록에 대한 권한이 없습니다."),

    // Bgm
    BGM_NOT_OWNED(HttpStatus.FORBIDDEN, "H006", "보유하지 않은 BGM입니다."),

    // Minihompy-Image
    IMAGE_DIMENSION_EXCEEDED(HttpStatus.BAD_REQUEST, "H007", "이미지 해상도가 너무 큽니다."),

    // Item
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "I001", "아이템을 찾을 수 없습니다."),
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "I002", "장바구니 아이템을 찾을 수 없습니다."),
    EMPTY_CART(HttpStatus.BAD_REQUEST, "I003", "장바구니가 비어 있습니다."),
    INSUFFICIENT_ACORNS(HttpStatus.BAD_REQUEST, "I004", "도토리 잔액이 부족합니다."),

    // Payment
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "PAY001", "주문을 찾을 수 없습니다."),
    AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "PAY002", "결제 금액이 주문 금액과 일치하지 않습니다."),
    ALREADY_PROCESSED_ORDER(HttpStatus.CONFLICT, "PAY003", "이미 처리된 주문입니다."),
    PAYMENT_CONFIRM_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "PAY004", "결제 승인에 실패했습니다."),

    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAY005", "결제 정보를 찾을 수 없습니다."),
    CANCEL_NOT_ALLOWED(HttpStatus.CONFLICT, "PAY006", "취소할 수 없는 주문 상태입니다."),
    REFUND_INSUFFICIENT_BALANCE(HttpStatus.CONFLICT, "PAY007", "도토리 잔액이 부족하여 환불할 수 없습니다."),
    PAYMENT_CANCEL_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "PAY008", "결제 취소에 실패했습니다. 잠시 후 자동으로 처리됩니다."),
    PAYMENT_PG_REJECTED(HttpStatus.BAD_REQUEST, "PAY009", "PG사에서 결제를 거절했습니다."),
    ORDER_IN_PROGRESS(HttpStatus.CONFLICT, "PAY010", "처리 중인 주문입니다. 잠시 후 다시 시도해주세요.");


    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
