package com.irfan.chat.controller;

import com.irfan.chat.model.Notification;
import com.irfan.chat.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    
    @GetMapping("/{username}")
    public List<Notification> getUserNotifications(@PathVariable String username) {
        return notificationService.getUserNotifications(username);
    }
    
    
    @GetMapping("/{username}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable String username) {
        return notificationService.getUnreadNotifications(username);
    }
    
    
    @GetMapping("/{username}/unread/count")
    public long getUnreadNotificationCount(@PathVariable String username) {
        return notificationService.getUnreadNotificationCount(username);
    }
    
   
    @PostMapping("/{username}/read/{chatId}")
    public String markNotificationsAsRead(@PathVariable String username, @PathVariable String chatId) {
        notificationService.markNotificationsAsRead(username, chatId);
        return "Notifications marked as read for chat: " + chatId;
    }
    
  
    @PostMapping("/{username}/read-all")
    public String markAllNotificationsAsRead(@PathVariable String username) {
        notificationService.markAllNotificationsAsRead(username);
        return "All notifications marked as read for user: " + username;
    }
    
   
    @DeleteMapping("/{notificationId}")
    public String deleteNotification(@PathVariable Long notificationId) {
        
        return "Notification deletion not yet implemented";
    }
    
    
    @PostMapping("/test/{username}")
    public String testNotification(@PathVariable String username) {
        try {
            notificationService.sendNotification(
                username, 
                "System", 
                "This is a test notification!", 
                "GLOBAL", 
                "test", 
                "TEST"
            );
            return "Test notification sent to " + username;
        } catch (Exception e) {
            return "Error sending test notification: " + e.getMessage();
        }
    }
}
