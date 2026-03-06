package com.skillbeacon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String clerkUserId;
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String profileImageUrl;
    private String authProviders;
}
