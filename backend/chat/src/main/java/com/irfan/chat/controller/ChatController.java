package com.irfan.chat.controller;

import com.irfan.chat.model.ChatMessage;
import com.irfan.chat.model.User;
import com.irfan.chat.service.ChatService;
import com.irfan.chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDateTime;
import java.util.List;
import com.irfan.chat.repository.MessageRepository;

@Controller
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private MessageRepository messageRepository;

    @GetMapping("/api/messages/private/{user1}/{user2}")
    @ResponseBody
    public List<ChatMessage> getPrivateMessages(@PathVariable String user1, @PathVariable String user2) {
        return chatService.getPrivateMessages(user1, user2);
    }

    @GetMapping("/api/users/online")
    @ResponseBody
    public List<User> getOnlineUsers() {
        return userService.getOnlineUsers();
    }

    @GetMapping("/api/messages/all")
    @ResponseBody
    public List<ChatMessage> getAllGlobalMessages() {
        return chatService.getAllGlobalMessages();
    }

    @GetMapping("/api/users/reset-offline")
    @ResponseBody
    public String resetAllUsersOffline() {
        userService.resetAllUsersOffline();
        return "All users reset to offline";
    }

    @GetMapping("/api/test/websocket/{username}")
    @ResponseBody
    public String testWebSocketRouting(@PathVariable String username) {
        System.out.println("Testing WebSocket routing for user: " + username);
        return "WebSocket test endpoint called for user: " + username;
    }

    @MessageMapping("/chat.send")
    public void sendGlobalMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received global message: " + chatMessage.getContent() + " from " + chatMessage.getSender());
        chatService.sendGlobalMessage(chatMessage);
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received private message via WebSocket: " + chatMessage.getContent() + " from " + chatMessage.getSender() + " to " + chatMessage.getRecipient());
        
        String recipient = chatMessage.getRecipient();
        ChatMessage privateMessage = new ChatMessage(chatMessage.getContent(), chatMessage.getSender(), recipient);
        chatService.sendPrivateMessage(privateMessage, recipient);
        
        chatService.notifyPrivateChatStarted(chatMessage.getSender(), recipient);
        
        System.out.println("Private message processed and sent to service");
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("User joining: " + chatMessage.getSender());
        
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        UserService.UserCreationResult result = userService.findOrCreateUserWithStatus(chatMessage.getSender());
        
        
        if (result.isNewUser()) {
            System.out.println("New user created: " + chatMessage.getSender() + ", sending join notification");
            chatService.notifyUserJoined(chatMessage.getSender());
        } else {
            System.out.println("Existing user reconnecting: " + chatMessage.getSender() + ", no notification needed");
        }
        
        userService.setUserOnline(chatMessage.getSender(), true);
        chatService.sendOnlineUsersUpdate();
    }

    @MessageMapping("/chat.reconnect")
    public void reconnectUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("User reconnecting: " + chatMessage.getSender());
        
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        userService.setUserOnline(chatMessage.getSender(), true);
        chatService.sendOnlineUsersUpdate();
    }

    @MessageMapping("/chat.removeUser")
    public void removeUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            userService.setUserOnline(username, false);
            
        }
    }
}