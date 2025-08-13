package com.irfan.chat.repository;

import com.irfan.chat.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT m FROM ChatMessage m ORDER BY m.timestamp DESC LIMIT :limit")
    List<ChatMessage> findRecentMessages(@Param("limit") int limit);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.sender = :sender ORDER BY m.timestamp DESC")
    List<ChatMessage> findBySender(@Param("sender") String sender);
    
    @Query("SELECT m FROM ChatMessage m ORDER BY m.timestamp ASC")
    List<ChatMessage> findAllOrderByTimestamp();
}
