package com.irfan.chat.controller;

import com.irfan.chat.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ChatController {

    @GetMapping("/test")
    @ResponseBody
    public String test() {
        return "Chat controller is working!";
    }

    @MessageMapping("/chat.send")  // Clients send to /app/chat.send
    @SendTo("/topic/global")       // Broadcast to all subscribers
    public ChatMessage sendMessage(ChatMessage message) {
        return message; // Message will be sent to all users in /topic/global
    }
}