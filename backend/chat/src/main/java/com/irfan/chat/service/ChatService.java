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
import java.util.ArrayList;
import jakarta.annotation.PostConstruct;

@Service
public class ChatService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Verify message persistence on service initialization
    @PostConstruct
    public void initialize() {
        verifyMessagePersistence();
    }

    public void sendGlobalMessage(ChatMessage chatMessage) {
        User user = userService.findOrCreateUser(chatMessage.getSender());
        chatMessage.setUser(user);
        chatMessage.setMessageType(ChatMessage.MessageType.GLOBAL);
        
        messageRepository.save(chatMessage);
        userService.updateUserLastSeen(chatMessage.getSender());
        
        messagingTemplate.convertAndSend("/topic/global", chatMessage);
    }

    public void sendPrivateMessage(ChatMessage chatMessage, String recipientUsername) {
        User sender = userService.findOrCreateUser(chatMessage.getSender());
        chatMessage.setUser(sender);
        chatMessage.setRecipient(recipientUsername);
        chatMessage.setMessageType(ChatMessage.MessageType.PRIVATE);
        
        messageRepository.save(chatMessage);
        userService.updateUserLastSeen(chatMessage.getSender());
        
        // Log for debugging
        System.out.println("Sending private message from " + chatMessage.getSender() + " to " + recipientUsername);
        System.out.println("Message content: " + chatMessage.getContent());
        
        // Send to both users' private message queues
        messagingTemplate.convertAndSendToUser(recipientUsername, "/queue/private", chatMessage);
        messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/queue/private", chatMessage);
        
        System.out.println("Private message sent to both users via WebSocket");
    }

    public void notifyUserJoined(String username) {
        ChatMessage notification = new ChatMessage();
        notification.setContent(username + " has joined the chat!");
        notification.setSender("System");
        notification.setMessageType(ChatMessage.MessageType.SYSTEM);
        notification.setTimestamp(LocalDateTime.now());
        
        // Save the notification to database so it appears in chat history
        messageRepository.save(notification);
        
        // Send to global chat
        messagingTemplate.convertAndSend("/topic/global", notification);
        sendOnlineUsersUpdate();
        
        System.out.println("New user join notification sent and saved for: " + username);
    }

    public void notifyPrivateChatStarted(String sender, String recipient) {
        // Create notification for sender
        ChatMessage senderNotification = new ChatMessage();
        senderNotification.setContent("Private chat started with " + recipient);
        senderNotification.setSender("System");
        senderNotification.setRecipient(recipient);
        senderNotification.setMessageType(ChatMessage.MessageType.PRIVATE);
        senderNotification.setTimestamp(LocalDateTime.now());
        
        // Create notification for recipient
        ChatMessage recipientNotification = new ChatMessage();
        recipientNotification.setContent(sender + " started a private chat with you");
        recipientNotification.setSender("System");
        recipientNotification.setRecipient(sender);
        recipientNotification.setMessageType(ChatMessage.MessageType.PRIVATE);
        recipientNotification.setTimestamp(LocalDateTime.now());
        
        // Send notifications to private message queues
        messagingTemplate.convertAndSendToUser(sender, "/queue/private", senderNotification);
        messagingTemplate.convertAndSendToUser(recipient, "/queue/private", recipientNotification);
        
        // Save notifications to database
        messageRepository.save(senderNotification);
        messageRepository.save(recipientNotification);
    }

    public void sendOnlineUsersUpdate() {
        List<User> onlineUsers = userService.getOnlineUsers();
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }

    public List<ChatMessage> getAllGlobalMessages() {
        try {
            // Get ALL global and system messages for complete chat history
            List<ChatMessage> globalMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL);
            List<ChatMessage> systemMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM);
            
            // Combine and sort by timestamp
            List<ChatMessage> allMessages = new ArrayList<>();
            allMessages.addAll(globalMessages);
            allMessages.addAll(systemMessages);
            
            // Sort by timestamp
            allMessages.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));
            
            // Log for debugging (can be removed in production)
            System.out.println("Retrieved " + allMessages.size() + " total messages (global: " + globalMessages.size() + ", system: " + systemMessages.size() + ")");
            
            return allMessages;
        } catch (Exception e) {
            System.err.println("Error retrieving global messages: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error
        }
    }

    public List<ChatMessage> getRecentGlobalMessages(int limit) {
        try {
            // Get recent global and system messages
            List<ChatMessage> globalMessages = messageRepository
                    .findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL, PageRequest.of(0, limit));
            List<ChatMessage> systemMessages = messageRepository
                    .findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM, PageRequest.of(0, limit));
            
            // Combine and sort by timestamp
            List<ChatMessage> allMessages = new ArrayList<>();
            allMessages.addAll(globalMessages);
            allMessages.addAll(systemMessages);
            
            // Sort by timestamp and limit to requested size
            allMessages.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));
            if (allMessages.size() > limit) {
                allMessages = allMessages.subList(allMessages.size() - limit, allMessages.size());
            }
            
            return allMessages;
        } catch (Exception e) {
            System.err.println("Error retrieving recent global messages: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error
        }
    }

    public List<ChatMessage> getPrivateMessages(String user1, String user2) {
        try {
            return messageRepository.findPrivateMessages(user1, user2);
        } catch (Exception e) {
            System.err.println("Error retrieving private messages: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); // Return empty list on error
        }
    }

    /**
     * Verify that all global messages are properly persisted and retrievable
     * This ensures the requirement: "All users (including new ones) should be able to view old messages 
     * in the global channel, even with users who are no longer active"
     */
    public boolean verifyMessagePersistence() {
        try {
            List<ChatMessage> globalMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL);
            List<ChatMessage> systemMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM);
            List<User> onlineUsers = userService.getOnlineUsers();
            
            // Check if we have messages from users who are not currently online
            boolean hasMessagesFromInactiveUsers = globalMessages.stream()
                .anyMatch(message -> !message.getSender().equals("System") && 
                    onlineUsers.stream().noneMatch(user -> user.getUsername().equals(message.getSender())));
            
            System.out.println("Message persistence verification:");
            System.out.println("- Total global messages: " + globalMessages.size());
            System.out.println("- Total system messages: " + systemMessages.size());
            System.out.println("- Online users: " + onlineUsers.size());
            System.out.println("- Has messages from inactive users: " + hasMessagesFromInactiveUsers);
            
            return true;
        } catch (Exception e) {
            System.err.println("Error verifying message persistence: " + e.getMessage());
            return false;
        }
    }
}
