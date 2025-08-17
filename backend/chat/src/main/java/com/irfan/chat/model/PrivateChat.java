package com.irfan.chat.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "private_chats")
@Data
@NoArgsConstructor
public class PrivateChat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user1", nullable = false)
    private String user1;
    
    @Column(name = "user2", nullable = false)
    private String user2;
    
    @Column(name = "last_message", nullable = true)
    private String lastMessage;
    
    @Column(name = "last_message_time", nullable = true)
    private LocalDateTime lastMessageTime;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @JsonIgnore
    @OneToMany(mappedBy = "privateChat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ChatMessage> messages;
    
    public PrivateChat(String user1, String user2) {
        this.user1 = user1;
        this.user2 = user2;
        this.createdAt = LocalDateTime.now();
        this.isActive = true;
    }
    
    public boolean involvesUser(String username) {
        return user1.equals(username) || user2.equals(username);
    }
    
    public String getOtherUser(String username) {
        if (user1.equals(username)) {
            return user2;
        } else if (user2.equals(username)) {
            return user1;
        }
        return null;
    }
    
    public void updateLastMessage(String message, LocalDateTime time) {
        this.lastMessage = message;
        this.lastMessageTime = time;
    }
}
