package com.irfan.chat.service;

import com.irfan.chat.model.ChatMessage;
import com.irfan.chat.model.PrivateChat;
import com.irfan.chat.repository.MessageRepository;
import com.irfan.chat.repository.PrivateChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PrivateChatService {
    
    @Autowired
    private PrivateChatRepository privateChatRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ChatService chatService;
    
    /**
     * Get or create a private chat between two users
     */
    @Transactional
    public PrivateChat getOrCreatePrivateChat(String user1, String user2) {
        System.out.println("Getting or creating private chat between " + user1 + " and " + user2);
        
        // Check if chat already exists
        Optional<PrivateChat> existingChat = privateChatRepository.findActiveChatBetweenUsers(user1, user2);
        
        if (existingChat.isPresent()) {
            System.out.println("Found existing chat: " + existingChat.get().getId());
            return existingChat.get();
        }
        
        // Create new chat
        PrivateChat newChat = new PrivateChat(user1, user2);
        PrivateChat savedChat = privateChatRepository.save(newChat);
        System.out.println("Created new private chat: " + savedChat.getId());
        
        return savedChat;
    }
    
    /**
     * Send a private message and update chat
     */
    @Transactional
    public ChatMessage sendPrivateMessage(String sender, String recipient, String content) {
        System.out.println("Sending private message from " + sender + " to " + recipient + ": " + content);
        
        // Get or create chat
        PrivateChat chat = getOrCreatePrivateChat(sender, recipient);
        
        // Create message
        ChatMessage message = new ChatMessage(content, sender, recipient);
        message.setPrivateChat(chat);
        message.setTimestamp(LocalDateTime.now());
        
        // Save message
        ChatMessage savedMessage = messageRepository.save(message);
        System.out.println("Saved private message: " + savedMessage.getId());
        
        // Update chat's last message
        chat.updateLastMessage(content, LocalDateTime.now());
        privateChatRepository.save(chat);
        System.out.println("Updated chat last message");
        

        
        return savedMessage;
    }
    

    
    /**
     * Get all private chats for a user
     */
    public List<PrivateChat> getUserPrivateChats(String username) {
        System.out.println("Getting private chats for user: " + username);
        List<PrivateChat> chats = privateChatRepository.findActiveChatsByUser(username);
        System.out.println("Found " + chats.size() + " chats for user " + username);
        return chats;
    }
    
    /**
     * Get messages for a specific chat
     */
    public List<ChatMessage> getChatMessages(Long chatId) {
        System.out.println("Getting messages for chat: " + chatId);
        List<ChatMessage> messages = messageRepository.findMessagesByChatId(chatId);
        System.out.println("Found " + messages.size() + " messages for chat " + chatId);
        return messages;
    }
    
    /**
     * Get messages between two users (legacy support)
     */
    public List<ChatMessage> getPrivateMessages(String user1, String user2) {
        System.out.println("Getting private messages between " + user1 + " and " + user2);
        List<ChatMessage> messages = messageRepository.findPrivateMessages(user1, user2);
        System.out.println("Found " + messages.size() + " messages between " + user1 + " and " + user2);
        return messages;
    }
    
    /**
     * Mark a chat as inactive
     */
    @Transactional
    public void deactivateChat(Long chatId) {
        System.out.println("Deactivating chat: " + chatId);
        Optional<PrivateChat> chatOpt = privateChatRepository.findById(chatId);
        if (chatOpt.isPresent()) {
            PrivateChat chat = chatOpt.get();
            chat.setIsActive(false);
            privateChatRepository.save(chat);
            System.out.println("Chat " + chatId + " deactivated");
        }
    }
    
    /**
     * Get chat summary
     */
    public String getChatSummary(Long chatId) {
        Optional<PrivateChat> chatOpt = privateChatRepository.findById(chatId);
        if (chatOpt.isPresent()) {
            PrivateChat chat = chatOpt.get();
            return chat.getLastMessage() != null ? chat.getLastMessage() : "No messages yet";
        }
        return "Chat not found";
    }
}
