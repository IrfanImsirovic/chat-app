package com.irfan.chat.repository;

import com.irfan.chat.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByOnlineTrue(); // Finds all online users
    Optional<User> findByUsername(String username); // Find user by username
}