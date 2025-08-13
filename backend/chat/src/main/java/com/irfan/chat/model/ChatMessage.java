package com.irfan.chat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private String content;
    private String sender;
    private LocalDateTime timestamp = LocalDateTime.now();
}
