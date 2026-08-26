package com.erpqlkho.backend.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception nghiep vu co chu dinh (vd: "khong du ton kho", "khong tim thay san pham").
 * Nem exception nay trong service layer, GlobalExceptionHandler se map sang HTTP status tuong ung.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(String message) {
        this(HttpStatus.BAD_REQUEST, message);
    }

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
