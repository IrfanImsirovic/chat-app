package com.irfan.chat.event;

import com.irfan.chat.service.ChatService;
import com.irfan.chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("New WebSocket connection established (Session: " + sessionId + ")");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (username != null) {
            userService.setUserOnline(username, false);
            userService.updateUserLastSeen(username);
            System.out.println("User disconnected: " + username + " (Session: " + sessionId + ") - set offline");
        } else {
            System.out.println("User disconnected (Session: " + sessionId + ") - no username found");
        }
    }
}
