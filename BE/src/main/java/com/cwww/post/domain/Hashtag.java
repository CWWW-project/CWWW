package com.cwww.post.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hashtag {

    private Long hashtagId;
    private String name;
}
