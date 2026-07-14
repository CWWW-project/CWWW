package com.cwww.minihompy.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;


// 프로필 사진 업로드 요청
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileImageUploadRequest {

    private MultipartFile file;

}
