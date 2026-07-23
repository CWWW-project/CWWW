package com.cwww.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 정적 리소스 서빙
 *
 * StorageService(LocalStorageServiceImpl)가 저장한 파일을
 * URL로 접근 가능하게 서빙해주는 공통 설정.
 *
 * storage.local.path 프로퍼티를 LocalStorageServiceImpl과 동일하게 참조하므로
 * 저장 위치와 서빙 위치가 항상 일치함.
 *
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${storage.local.path:uploads}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}
