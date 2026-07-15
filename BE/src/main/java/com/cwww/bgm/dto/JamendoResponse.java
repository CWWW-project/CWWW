package com.cwww.bgm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record JamendoResponse(
        List<JamendoTrack> results
) {}
