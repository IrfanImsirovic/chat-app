package com.irfan.chat.repository;

import com.irfan.chat.model.PrivateChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PrivateChatRepository extends JpaRepository<PrivateChat, Long> {
    
    @Query("SELECT pc FROM PrivateChat pc WHERE (pc.user1 = :username OR pc.user2 = :username) AND pc.isActive = true ORDER BY pc.lastMessageTime DESC NULLS LAST")
    List<PrivateChat> findActiveChatsByUser(@Param("username") String username);
    
    @Query("SELECT pc FROM PrivateChat pc WHERE ((pc.user1 = :user1 AND pc.user2 = :user2) OR (pc.user1 = :user2 AND pc.user2 = :user1)) AND pc.isActive = true")
    Optional<PrivateChat> findActiveChatBetweenUsers(@Param("user1") String user1, @Param("user2") String user2);
    
    @Query("SELECT pc FROM PrivateChat pc WHERE pc.user1 = :username OR pc.user2 = :username")
    List<PrivateChat> findAllChatsByUser(@Param("username") String username);
    
    @Query("SELECT pc FROM PrivateChat pc WHERE pc.isActive = true ORDER BY pc.lastMessageTime DESC NULLS LAST")
    List<PrivateChat> findAllActiveChats();
}
