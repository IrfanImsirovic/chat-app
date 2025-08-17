package com.irfan.chat.service;

import com.irfan.chat.model.Notification;
import com.irfan.chat.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
   
    public void sendNotification(String recipient, String sender, String content, String chatType, String chatId, String messageType) {
        try {
        
            Notification notification = new Notification(recipient, sender, content, chatType, chatId, messageType);
            notificationRepository.save(notification);
            
            
            try {
                
                messagingTemplate.convertAndSendToUser(
                    recipient,
                    "/queue/notifications",
                    notification
                );
                System.out.println("Notification sent via /user/queue/notifications to " + recipient);
            } catch (Exception e) {
                System.err.println("Error sending via user queue: " + e.getMessage());
            }
            
            try {
                
                messagingTemplate.convertAndSend("/topic/user/" + recipient + "/notifications", notification);
                System.out.println("Notification sent via /topic/user/" + recipient + "/notifications");
            } catch (Exception e) {
                System.err.println("Error sending via user topic: " + e.getMessage());
            }
            
            try {
                
                messagingTemplate.convertAndSend("/topic/notifications", 
                    Map.of("recipient", recipient, "notification", notification));
                System.out.println("Notification sent via /topic/notifications");
            } catch (Exception e) {
                System.err.println("Error sending via global topic: " + e.getMessage());
            }
            
            
            messagingTemplate.convertAndSend("/topic/notifications-debug", 
                Map.of("recipient", recipient, "notification", notification));
            
            System.out.println("Notification sent to " + recipient + ": " + content);
        } catch (Exception e) {
            System.err.println("Error sending notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    
    public void sendPrivateMessageNotification(String recipient, String sender, String content) {
        sendNotification(recipient, sender, content, "PRIVATE", sender, "MESSAGE");
    }
    
    
    public void sendGlobalMessageNotification(String recipient, String sender, String content) {
        sendNotification(recipient, sender, content, "GLOBAL", "general", "MESSAGE");
    }
   
    public void sendUserJoinedNotification(String username) {
    
        System.out.println("User joined notification for: " + username);
    }
    
  
    public void sendTypingNotification(String recipient, String sender, String chatType, String chatId) {
        sendNotification(recipient, sender, sender + " is typing...", chatType, chatId, "TYPING");
    }
    
 
    public void sendStopTypingNotification(String recipient, String sender, String chatType, String chatId) {
        sendNotification(recipient, sender, sender + " stopped typing", chatType, chatId, "STOP_TYPING");
    }
    
 
    public List<Notification> getUserNotifications(String username) {
        return notificationRepository.findByRecipientOrderByTimestampDesc(username);
    }

    public List<Notification> getUnreadNotifications(String username) {
        return notificationRepository.findByRecipientAndReadFalseOrderByTimestampDesc(username);
    }
  
    public long getUnreadNotificationCount(String username) {
        return notificationRepository.countByRecipientAndReadFalse(username);
    }
  
    public void markNotificationsAsRead(String username, String chatId) {
        try {
            notificationRepository.markAsReadByRecipientAndChatId(username, chatId);
        } catch (Exception e) {
            System.err.println("Error marking notifications as read: " + e.getMessage());
        }
    }
  
    public void markAllNotificationsAsRead(String username) {
        try {
            notificationRepository.markAllAsReadByRecipient(username);
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
        }
    }
 
    public void cleanupOldNotifications() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            notificationRepository.deleteOldNotifications(cutoffDate);
            System.out.println("Old notifications cleaned up");
        } catch (Exception e) {
            System.err.println("Error cleaning up old notifications: " + e.getMessage());
        }
    }
}
