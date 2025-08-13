package com.irfan.chat.controller;

import com.irfan.chat.model.ChatMessage;
import com.irfan.chat.model.User;
import com.irfan.chat.repository.MessageRepository;
import com.irfan.chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/test")
    @ResponseBody
    public String test() {
        return "Chat controller is working!";
    }

    @MessageMapping("/chat.send")  // Clients send to /app/chat.send
    @SendTo("/topic/global")       // Broadcast to all subscribers
    public ChatMessage sendMessage(ChatMessage chatMessage) {
        // Find or create user
        User user = userRepository.findByUsername(chatMessage.getSender())
                .orElseGet(() -> {
                    User newUser = new User(chatMessage.getSender());
                    return userRepository.save(newUser);
                });
        
        // Set the user and save to database
        chatMessage.setUser(user);
        messageRepository.save(chatMessage);
        
        // Update user's last seen
        user.setLastSeen(java.time.LocalDateTime.now());
        userRepository.save(user);
        
        return chatMessage; // Message will be sent to all users in /topic/global
    }
}