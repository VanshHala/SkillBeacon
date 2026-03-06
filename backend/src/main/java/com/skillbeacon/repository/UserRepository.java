package com.skillbeacon.repository;

import com.skillbeacon.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByClerkUserId(String clerkUserId);

    Optional<User> findByEmail(String email);
}
