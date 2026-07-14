package com.cwww.minihompy.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitLog {

    private Long visitId;
    private Long visitorId;
    private Long minihompyId;
    private LocalDateTime visitedAt;

}
