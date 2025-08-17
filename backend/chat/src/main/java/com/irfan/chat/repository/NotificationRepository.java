package com.irfan.chat.repository;

import com.irfan.chat.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    
    List<Notification> findByRecipientOrderByTimestampDesc(String recipient);
    
    
    List<Notification> findByRecipientAndReadFalseOrderByTimestampDesc(String recipient);
    
   
    List<Notification> findByRecipientAndChatTypeOrderByTimestampDesc(String recipient, String chatType);
    
    
    List<Notification> findByRecipientAndChatIdOrderByTimestampDesc(String recipient, String chatId);
    
    
    long countByRecipientAndReadFalse(String recipient);
    
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient AND n.chatId = :chatId")
    void markAsReadByRecipientAndChatId(@Param("recipient") String recipient, @Param("chatId") String chatId);
    
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient")
    void markAllAsReadByRecipient(@Param("recipient") String recipient);
    
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.timestamp < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
