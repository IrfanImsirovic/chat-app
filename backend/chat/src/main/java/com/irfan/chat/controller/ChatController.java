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

import java.util.List;

@Controller
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @GetMapping("/test")
    @ResponseBody
    public String test() {
        return "Chat controller is working!";
    }

    @GetMapping("/test-user")
    @ResponseBody
    public String testUser() {
        User user = userService.createNewUser();
        return "Created user: " + user.getUsername() + " (ID: " + user.getId() + ")";
    }

    @GetMapping("/api/users/online")
    @ResponseBody
    public List<User> getOnlineUsers() {
        return userService.getOnlineUsers();
    }

    @GetMapping("/api/messages/recent")
    @ResponseBody
    public List<ChatMessage> getRecentMessages() {
        return chatService.getRecentGlobalMessages(50);
    }

    @GetMapping("/api/messages/private/{user1}/{user2}")
    @ResponseBody
    public List<ChatMessage> getPrivateMessages(@PathVariable String user1, @PathVariable String user2) {
        return chatService.getPrivateMessages(user1, user2);
    }

    @GetMapping("/api/users/reset-offline")
    @ResponseBody
    public String resetAllUsersOffline() {
        userService.resetAllUsersOffline();
        return "All users reset to offline";
    }

    @MessageMapping("/chat.send")
    public void sendGlobalMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received global message: " + chatMessage.getContent() + " from " + chatMessage.getSender());
        chatService.sendGlobalMessage(chatMessage);
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received private message: " + chatMessage.getContent() + " from " + chatMessage.getSender());
        String recipient = chatMessage.getRecipient();
        ChatMessage privateMessage = new ChatMessage(chatMessage.getContent(), chatMessage.getSender(), recipient);
        chatService.sendPrivateMessage(privateMessage, recipient);
        
        chatService.notifyPrivateChatStarted(chatMessage.getSender(), recipient);
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/global")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("User joining: " + chatMessage.getSender());
        
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        User user = userService.findOrCreateUser(chatMessage.getSender());
        
        // Always set user as online when they connect
        userService.setUserOnline(chatMessage.getSender(), true);
        
        // Send join notification
        chatService.notifyUserJoined(chatMessage.getSender());
        
        // Update online users list
        chatService.sendOnlineUsersUpdate();
        
        return chatMessage;
    }

    @MessageMapping("/chat.reconnect")
    @SendTo("/topic/global")
    public ChatMessage reconnectUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("User reconnecting: " + chatMessage.getSender());
        
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        userService.setUserOnline(chatMessage.getSender(), true);
        
        chatService.sendOnlineUsersUpdate();
        
        return chatMessage;
    }

    @MessageMapping("/chat.removeUser")
    @SendTo("/topic/global")
    public ChatMessage removeUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            userService.setUserOnline(username, false);
            chatService.notifyUserLeft(username);
        }
        return chatMessage;
    }
}