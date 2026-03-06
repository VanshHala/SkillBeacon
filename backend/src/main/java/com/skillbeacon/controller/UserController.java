package com.skillbeacon.controller;

import com.skillbeacon.dto.UserDto;
import com.skillbeacon.model.User;
import com.skillbeacon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;

    @PostMapping("/sync")
    public ResponseEntity<User> syncProfile(@RequestBody UserDto userDto) {
        log.info("Syncing profile for user: {}", userDto.getClerkUserId());

        Optional<User> optionalUser = userRepository.findByClerkUserId(userDto.getClerkUserId());

        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            // Update fields if they changed
            user.setEmail(userDto.getEmail());
            user.setName(userDto.getName());
            user.setFirstName(userDto.getFirstName());
            user.setLastName(userDto.getLastName());
            user.setProfileImageUrl(userDto.getProfileImageUrl());
            user.setAuthProviders(userDto.getAuthProviders());
        } else {
            // Create new user record
            user = User.builder()
                    .clerkUserId(userDto.getClerkUserId())
                    .email(userDto.getEmail())
                    .name(userDto.getName())
                    .firstName(userDto.getFirstName())
                    .lastName(userDto.getLastName())
                    .profileImageUrl(userDto.getProfileImageUrl())
                    .authProviders(userDto.getAuthProviders())
                    .build();
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}
