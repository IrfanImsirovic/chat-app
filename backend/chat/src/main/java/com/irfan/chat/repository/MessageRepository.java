package com.irfan.chat.repository;

import com.irfan.chat.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<ChatMessage, Long> {
    // Use Pageable instead of non-portable LIMIT in JPQL
    List<ChatMessage> findByMessageTypeOrderByTimestampDesc(ChatMessage.MessageType messageType, Pageable pageable);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.messageType = 'PRIVATE' AND ((m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)) ORDER BY m.timestamp ASC")
    List<ChatMessage> findPrivateMessages(@Param("user1") String user1, @Param("user2") String user2);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.sender = :sender ORDER BY m.timestamp DESC")
    List<ChatMessage> findBySender(@Param("sender") String sender);
    
    @Query("SELECT m FROM ChatMessage m ORDER BY m.timestamp ASC")
    List<ChatMessage> findAllOrderByTimestamp();
}
