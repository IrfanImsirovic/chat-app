package com.irfan.chat.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

class SimplePrincipal implements Principal {
    private final String name;
    SimplePrincipal(String name) { this.name = name; }
    @Override public String getName() { return name; }
}

public class UserHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String query = request.getURI().getQuery();
        String username = null;
        if (query != null) {
            for (String part : query.split("&")) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2 && kv[0].equals("username")) {
                    username = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                    break;
                }
            }
        }
        if (username == null || username.isBlank()) {
            username = "anon-" + java.util.UUID.randomUUID();
        }
        
        return new SimplePrincipal(username);
    }
}


