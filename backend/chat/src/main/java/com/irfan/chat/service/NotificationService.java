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
    
    /**
     * Send a notification to a specific user
     */
    public void sendNotification(String recipient, String sender, String content, String chatType, String chatId, String messageType) {
        try {
            // Create and save the notification
            Notification notification = new Notification(recipient, sender, content, chatType, chatId, messageType);
            notificationRepository.save(notification);
            
            // Send real-time notification via WebSocket - try multiple approaches
            try {
                // Method 1: User-specific queue (primary)
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
                // Method 2: User-specific topic (backup)
                messagingTemplate.convertAndSend("/topic/user/" + recipient + "/notifications", notification);
                System.out.println("Notification sent via /topic/user/" + recipient + "/notifications");
            } catch (Exception e) {
                System.err.println("Error sending via user topic: " + e.getMessage());
            }
            
            try {
                // Method 3: Global topic with recipient info (fallback)
                messagingTemplate.convertAndSend("/topic/notifications", 
                    Map.of("recipient", recipient, "notification", notification));
                System.out.println("Notification sent via /topic/notifications");
            } catch (Exception e) {
                System.err.println("Error sending via global topic: " + e.getMessage());
            }
            
            // Debug topic
            messagingTemplate.convertAndSend("/topic/notifications-debug", 
                Map.of("recipient", recipient, "notification", notification));
            
            System.out.println("Notification sent to " + recipient + ": " + content);
        } catch (Exception e) {
            System.err.println("Error sending notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send notification for new private message
     */
    public void sendPrivateMessageNotification(String recipient, String sender, String content) {
        sendNotification(recipient, sender, content, "PRIVATE", sender, "MESSAGE");
    }
    
    /**
     * Send notification for new global message
     */
    public void sendGlobalMessageNotification(String recipient, String sender, String content) {
        sendNotification(recipient, sender, content, "GLOBAL", "general", "MESSAGE");
    }
    
    /**
     * Send notification for user joining
     */
    public void sendUserJoinedNotification(String username) {
        // Send to all online users except the one who joined
        // This would typically be handled by the ChatService
        // For now, we'll just log it
        System.out.println("User joined notification for: " + username);
    }
    
    /**
     * Send typing indicator notification
     */
    public void sendTypingNotification(String recipient, String sender, String chatType, String chatId) {
        sendNotification(recipient, sender, sender + " is typing...", chatType, chatId, "TYPING");
    }
    
    /**
     * Send stop typing notification
     */
    public void sendStopTypingNotification(String recipient, String sender, String chatType, String chatId) {
        sendNotification(recipient, sender, sender + " stopped typing", chatType, chatId, "STOP_TYPING");
    }
    
    /**
     * Get all notifications for a user
     */
    public List<Notification> getUserNotifications(String username) {
        return notificationRepository.findByRecipientOrderByTimestampDesc(username);
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(String username) {
        return notificationRepository.findByRecipientAndReadFalseOrderByTimestampDesc(username);
    }
    
    /**
     * Get unread notification count for a user
     */
    public long getUnreadNotificationCount(String username) {
        return notificationRepository.countByRecipientAndReadFalse(username);
    }
    
    /**
     * Mark notifications as read for a specific chat
     */
    public void markNotificationsAsRead(String username, String chatId) {
        try {
            notificationRepository.markAsReadByRecipientAndChatId(username, chatId);
        } catch (Exception e) {
            System.err.println("Error marking notifications as read: " + e.getMessage());
        }
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public void markAllNotificationsAsRead(String username) {
        try {
            notificationRepository.markAllAsReadByRecipient(username);
        } catch (Exception e) {
            System.err.println("Error marking all notifications as read: " + e.getMessage());
        }
    }
    
    /**
     * Clean up old notifications (older than 30 days)
     */
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
