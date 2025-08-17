
CREATE TABLE IF NOT EXISTS private_chats (
    id BIGSERIAL PRIMARY KEY,
    user1 VARCHAR(255) NOT NULL,
    user2 VARCHAR(255) NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user1, user2)
);


DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'private_chat_id') THEN
        ALTER TABLE messages ADD COLUMN private_chat_id BIGINT;
        ALTER TABLE messages ADD CONSTRAINT fk_messages_private_chat 
            FOREIGN KEY (private_chat_id) REFERENCES private_chats(id);
    END IF;
END $$;


CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1);
CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2);
CREATE INDEX IF NOT EXISTS idx_private_chats_active ON private_chats(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_private_chat_id ON messages(private_chat_id);


CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    chat_type VARCHAR(50) NOT NULL,
    chat_id VARCHAR(255),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    message_type VARCHAR(50) NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient, read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_chat_id ON notifications(chat_id);


