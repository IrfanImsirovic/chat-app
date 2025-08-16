package com.irfan.chat.service;

import com.irfan.chat.model.User;
import com.irfan.chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private static final String[] ADJECTIVES = {
        "Happy", "Clever", "Brave", "Wise", "Swift", "Bright", "Calm", "Eager", 
        "Friendly", "Gentle", "Honest", "Kind", "Lucky", "Mighty", "Noble", "Proud"
    };

    private static final String[] NOUNS = {
        "Tiger", "Eagle", "Lion", "Wolf", "Bear", "Fox", "Hawk", "Dragon",
        "Phoenix", "Warrior", "Knight", "Wizard", "Archer", "Mage", "Hero", "Champion"
    };

    public User createNewUser() {
        String username = generateRandomUsername();
        User user = new User(username);
        user.setOnline(true);
        user.setLastSeen(LocalDateTime.now());
        return userRepository.save(user);
    }

    public String generateRandomUsername() {
        Random random = new Random();
        String adjective = ADJECTIVES[random.nextInt(ADJECTIVES.length)];
        String noun = NOUNS[random.nextInt(NOUNS.length)];
        int number = random.nextInt(999) + 1;
        return adjective + noun + number;
    }

    public static class UserCreationResult {
        private final User user;
        private final boolean isNewUser;
        
        public UserCreationResult(User user, boolean isNewUser) {
            this.user = user;
            this.isNewUser = isNewUser;
        }
        
        public User getUser() { return user; }
        public boolean isNewUser() { return isNewUser; }
    }

    public UserCreationResult findOrCreateUserWithStatus(String username) {
        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            return new UserCreationResult(existingUser.get(), false);
        } else {
            User newUser = new User(username);
            newUser.setOnline(false);
            newUser.setLastSeen(LocalDateTime.now());
            User savedUser = userRepository.save(newUser);
            return new UserCreationResult(savedUser, true);
        }
    }

    public User findOrCreateUser(String username) {
        return findOrCreateUserWithStatus(username).getUser();
    }

    public List<User> getOnlineUsers() {
        List<User> onlineUsers = userRepository.findByOnlineTrue();
        System.out.println("UserService: Found " + onlineUsers.size() + " online users:");
        onlineUsers.forEach(user -> System.out.println("  - " + user.getUsername() + " (online: " + user.isOnline() + ")"));
        return onlineUsers;
    }

    public void updateUserLastSeen(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    public void setUserOnline(String username, boolean online) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setOnline(online);
            user.setLastSeen(LocalDateTime.now());
            User savedUser = userRepository.save(user);
            System.out.println("User " + username + " online status set to: " + savedUser.isOnline());
        });
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public void resetAllUsersOffline() {
        List<User> allUsers = userRepository.findAll();
        allUsers.forEach(user -> {
            if (user.isOnline()) {
                user.setOnline(false);
                userRepository.save(user);
            }
        });
        System.out.println("UserService: Reset all users to offline status");
    }
}
