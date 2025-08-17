package com.irfan.chat.controller;

import com.irfan.chat.model.ChatMessage;
import com.irfan.chat.model.User;
import com.irfan.chat.model.PrivateChat;
import com.irfan.chat.service.ChatService;
import com.irfan.chat.service.UserService;
import com.irfan.chat.service.PrivateChatService;
import com.irfan.chat.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.irfan.chat.repository.MessageRepository;

@Controller
public class ChatController {

        @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private PrivateChatService privateChatService;

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
    
    @Autowired
    private NotificationService notificationService;

    @GetMapping("/api/messages/private/{user1}/{user2}")
    @ResponseBody
    public List<ChatMessage> getPrivateMessages(@PathVariable String user1, @PathVariable String user2) {
        System.out.println("API: Fetching private messages between " + user1 + " and " + user2);
        List<ChatMessage> messages = chatService.getPrivateMessages(user1, user2);
        System.out.println("API: Returning " + messages.size() + " messages");
        return messages;
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
    
    @PostMapping("/api/users/disconnect/{username}")
    @ResponseBody
    public String userDisconnect(@PathVariable String username) {
        userService.setUserOnline(username, false);
        userService.updateUserLastSeen(username);
        chatService.sendOnlineUsersUpdate();
        return "User " + username + " marked as offline";
    }


    
    @GetMapping("/api/private-chats/{username}")
    @ResponseBody
    public List<PrivateChat> getUserPrivateChats(@PathVariable String username) {
        System.out.println("Getting private chats for user: " + username);
        return privateChatService.getUserPrivateChats(username);
    }
    
    @GetMapping("/api/private-chat/{chatId}/messages")
    @ResponseBody
    public List<ChatMessage> getChatMessages(@PathVariable Long chatId) {
        System.out.println("Getting messages for chat: " + chatId);
        return privateChatService.getChatMessages(chatId);
    }
    
    @GetMapping("/api/private-chat/{user1}/{user2}/messages")
    @ResponseBody
    public List<ChatMessage> getPrivateMessagesBetweenUsers(@PathVariable String user1, @PathVariable String user2) {
        System.out.println("Getting messages between " + user1 + " and " + user2);
        return privateChatService.getPrivateMessages(user1, user2);
    }
    
    @MessageMapping("/chat.send")
    public void sendGlobalMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received global message from: " + chatMessage.getSender());
        chatService.sendGlobalMessage(chatMessage);
        
        
        List<User> onlineUsers = userService.getOnlineUsers();
        System.out.println("Sending global message notifications to " + (onlineUsers.size() - 1) + " users");
        for (User user : onlineUsers) {
            if (!user.getUsername().equals(chatMessage.getSender())) {
                System.out.println("Sending notification to user: " + user.getUsername());
                notificationService.sendGlobalMessageNotification(user.getUsername(), chatMessage.getSender(), chatMessage.getContent());
            }
        }
    }

    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        String recipient = chatMessage.getRecipient();
        String sender = chatMessage.getSender();
        
        System.out.println("Received private message from " + sender + " to " + recipient);
        System.out.println("Message content: " + chatMessage.getContent());
        
        try {
            
            ChatMessage savedMessage = privateChatService.sendPrivateMessage(sender, recipient, chatMessage.getContent());
            System.out.println("Private message saved with ID: " + savedMessage.getId());
            
            
            simpMessagingTemplate.convertAndSendToUser(
                recipient,
                "/queue/private",
                savedMessage
            );
            
            
            if (!recipient.equals(sender)) {
                System.out.println("Sending private message notification to: " + recipient);
                notificationService.sendPrivateMessageNotification(recipient, sender, chatMessage.getContent());
            }
            
            System.out.println("Private message sent successfully to " + recipient);
            
        } catch (Exception e) {
            System.err.println("Error sending private message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        UserService.UserCreationResult result = userService.findOrCreateUserWithStatus(chatMessage.getSender());
        
        if (result.isNewUser()) {
            chatService.notifyUserJoined(chatMessage.getSender());
        }
        
        userService.setUserOnline(chatMessage.getSender(), true);
        chatService.sendOnlineUsersUpdate();
    }

    @MessageMapping("/chat.reconnect")
    public void reconnectUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        
        userService.setUserOnline(chatMessage.getSender(), true);
        chatService.sendOnlineUsersUpdate();
    }

    @MessageMapping("/chat.removeUser")
    public void removeUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        if (username != null) {
            userService.setUserOnline(username, false);
            userService.updateUserLastSeen(username);
            chatService.sendOnlineUsersUpdate();
        }
    }
}