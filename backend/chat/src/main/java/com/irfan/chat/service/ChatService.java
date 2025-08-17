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

    
    @PostConstruct
    public void initialize() {
        verifyMessagePersistence();
    }

    public void sendGlobalMessage(ChatMessage chatMessage) {
        User user = userService.findOrCreateUserWithStatus(chatMessage.getSender()).getUser();
        chatMessage.setUser(user);
        chatMessage.setMessageType(ChatMessage.MessageType.GLOBAL);
        
        messageRepository.save(chatMessage);
        userService.updateUserLastSeen(chatMessage.getSender());
        
        messagingTemplate.convertAndSend("/topic/global", chatMessage);
    }

    public void sendPrivateMessage(ChatMessage chatMessage, String recipientUsername) {
        System.out.println("Sending private message from " + chatMessage.getSender() + " to " + recipientUsername);
        System.out.println("Message content: " + chatMessage.getContent());
        
        User sender = userService.findOrCreateUserWithStatus(chatMessage.getSender()).getUser();
        chatMessage.setUser(sender);
        chatMessage.setRecipient(recipientUsername);
        chatMessage.setMessageType(ChatMessage.MessageType.PRIVATE);
        
        try {
            ChatMessage savedMessage = messageRepository.save(chatMessage);
            System.out.println("Private message saved to database with ID: " + savedMessage.getId());
        } catch (Exception e) {
            System.err.println("Error saving private message to database: " + e.getMessage());
            e.printStackTrace();
        }
        
        userService.updateUserLastSeen(chatMessage.getSender());
        
        try {
            messagingTemplate.convertAndSendToUser(recipientUsername, "/queue/private", chatMessage);
            System.out.println("Private message sent to recipient: " + recipientUsername);
            messagingTemplate.convertAndSendToUser(chatMessage.getSender(), "/queue/private", chatMessage);
            System.out.println("Private message sent to sender: " + chatMessage.getSender());
        } catch (Exception e) {
            System.err.println("Error sending private message via WebSocket: " + e.getMessage());
            e.printStackTrace();
        }
    }



    public void notifyUserJoined(String username) {
        ChatMessage notification = new ChatMessage();
        notification.setContent(username + " has joined the chat!");
        notification.setSender("System");
        notification.setMessageType(ChatMessage.MessageType.SYSTEM);
        notification.setTimestamp(LocalDateTime.now());
        
        messageRepository.save(notification);
        messagingTemplate.convertAndSend("/topic/global", notification);
        sendOnlineUsersUpdate();
    }



    public void sendOnlineUsersUpdate() {
        List<User> onlineUsers = userService.getOnlineUsers();
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }


    

    

    

    




    private List<ChatMessage> getGlobalAndSystemMessages(PageRequest pageRequest) {
        try {
            List<ChatMessage> globalMessages = pageRequest != null 
                ? messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL, pageRequest)
                : messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL);
            
            List<ChatMessage> systemMessages = pageRequest != null 
                ? messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM, pageRequest)
                : messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM);
            
            List<ChatMessage> allMessages = new ArrayList<>();
            allMessages.addAll(globalMessages);
            allMessages.addAll(systemMessages);
            
            // Note: NOTIFICATION messages are excluded from global messages
            // They are only shown in private conversations
            
            allMessages.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));
            
            return allMessages;
        } catch (Exception e) {
            return new ArrayList<>(); 
        }
    }

    public List<ChatMessage> getAllGlobalMessages() {
        return getGlobalAndSystemMessages(null);
    }

    public List<ChatMessage> getRecentGlobalMessages(int limit) {
        List<ChatMessage> messages = getGlobalAndSystemMessages(PageRequest.of(0, limit));
        if (messages.size() > limit) {
            messages = messages.subList(messages.size() - limit, messages.size());
        }
        return messages;
    }

    public List<ChatMessage> getPrivateMessages(String user1, String user2) {
        try {
            System.out.println("Fetching private messages between: " + user1 + " and " + user2);
            List<ChatMessage> messages = messageRepository.findPrivateMessages(user1, user2);
            System.out.println("Found " + messages.size() + " private messages");
            return messages;
        } catch (Exception e) {
            System.err.println("Error fetching private messages between " + user1 + " and " + user2 + ": " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>(); 
        }
    }



    public boolean verifyMessagePersistence() {
        try {
            List<ChatMessage> globalMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.GLOBAL);
            List<ChatMessage> systemMessages = messageRepository.findByMessageTypeOrderByTimestampAsc(ChatMessage.MessageType.SYSTEM);
            List<User> onlineUsers = userService.getOnlineUsers();
            
            boolean hasMessagesFromInactiveUsers = globalMessages.stream()
                .anyMatch(message -> !message.getSender().equals("System") && 
                    onlineUsers.stream().noneMatch(user -> user.getUsername().equals(message.getSender())));
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
