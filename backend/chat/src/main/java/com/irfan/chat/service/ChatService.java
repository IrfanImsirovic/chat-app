package com.irfan.chat.service;

import com.irfan.chat.model.ChatMessage;
import com.irfan.chat.model.User;
import com.irfan.chat.repository.MessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendGlobalMessage(ChatMessage chatMessage) {
        System.out.println("ChatService: Processing global message from " + chatMessage.getSender());
        
        User user = userService.findOrCreateUser(chatMessage.getSender());
        chatMessage.setUser(user);
        chatMessage.setMessageType(ChatMessage.MessageType.GLOBAL);
        messageRepository.save(chatMessage);
        
        userService.updateUserLastSeen(chatMessage.getSender());
        
        messagingTemplate.convertAndSend("/topic/global", chatMessage);
        System.out.println("ChatService: Sent global message to /topic/global");
    }

    public void sendPrivateMessage(ChatMessage chatMessage, String recipientUsername) {
        System.out.println("ChatService: Processing private message from " + chatMessage.getSender() + " to " + recipientUsername);
        
        User sender = userService.findOrCreateUser(chatMessage.getSender());
        chatMessage.setUser(sender);
        chatMessage.setRecipient(recipientUsername);
        chatMessage.setMessageType(ChatMessage.MessageType.PRIVATE);
        messageRepository.save(chatMessage);
        
        userService.updateUserLastSeen(chatMessage.getSender());
        
        messagingTemplate.convertAndSendToUser(recipientUsername, "/queue/private", chatMessage);
        messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/queue/private", chatMessage);
        System.out.println("ChatService: Sent private message to both users");
    }

    public void notifyUserJoined(String username) {
        System.out.println("ChatService: Notifying that " + username + " joined");
        
        ChatMessage notification = new ChatMessage();
        notification.setContent(username + " has joined the chat!");
        notification.setSender("System");
        notification.setMessageType(ChatMessage.MessageType.SYSTEM);
        notification.setTimestamp(LocalDateTime.now());
        
        System.out.println("ChatService: Sending join notification to /topic/global");
        messagingTemplate.convertAndSend("/topic/global", notification);
        
        sendOnlineUsersUpdate();
    }

    public void notifyUserLeft(String username) {
        System.out.println("ChatService: Notifying that " + username + " left");
        
        ChatMessage notification = new ChatMessage();
        notification.setContent(username + " has left the chat");
        notification.setSender("System");
        notification.setMessageType(ChatMessage.MessageType.SYSTEM);
        notification.setTimestamp(LocalDateTime.now());
        
        messagingTemplate.convertAndSend("/topic/global", notification);
        
        sendOnlineUsersUpdate();
    }

    public void notifyPrivateChatStarted(String sender, String recipient) {
        ChatMessage notification = new ChatMessage();
        notification.setContent("Private chat started with " + recipient);
        notification.setSender("System");
        notification.setMessageType(ChatMessage.MessageType.SYSTEM);
        notification.setTimestamp(LocalDateTime.now());
        
        messagingTemplate.convertAndSendToUser(sender, "/queue/notifications", notification);
        
        ChatMessage recipientNotification = new ChatMessage();
        recipientNotification.setContent(sender + " started a private chat with you");
        recipientNotification.setSender("System");
        recipientNotification.setMessageType(ChatMessage.MessageType.SYSTEM);
        recipientNotification.setTimestamp(LocalDateTime.now());
        
        messagingTemplate.convertAndSendToUser(recipient, "/queue/notifications", recipientNotification);
    }

    public void sendOnlineUsersUpdate() {
        List<User> onlineUsers = userService.getOnlineUsers();
        System.out.println("ChatService: Sending online users update. Count: " + onlineUsers.size());
        onlineUsers.forEach(user -> System.out.println("  - " + user.getUsername()));
        
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }

    public List<ChatMessage> getRecentGlobalMessages(int limit) {
        return messageRepository
                .findByMessageTypeOrderByTimestampDesc(ChatMessage.MessageType.GLOBAL, PageRequest.of(0, limit));
    }

    public List<ChatMessage> getPrivateMessages(String user1, String user2) {
        return messageRepository.findPrivateMessages(user1, user2);
    }
}
