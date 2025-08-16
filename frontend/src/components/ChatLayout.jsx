import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalChat from './GlobalChat'
import DirectChat from './DirectChat'

function ChatLayout({
  username,
  connected,
  connecting,
  loading,
  onlineUsers,
  globalMessages,
  privateMessages,
  message,
  setMessage,
  onSendGlobal,
  onSendPrivate,
  onRetryMessages,
  onOpenDM,
  onTestWebSocket,
  currentRoute,
  dmUsername,
  onBackToGeneral,
  onLogout
}) {
  const navigate = useNavigate()
  
  // Load private messages from API when DM route changes
  useEffect(() => {
    if (dmUsername && username) {
      const loadMessages = async () => {
        try {
          console.log(`🔄 Loading private messages for DM with ${dmUsername}`)
          const response = await fetch(`http://localhost:8080/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(dmUsername)}`)
          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Loaded ${data.length} private messages for ${dmUsername}:`, data)
            // Update the parent state instead of local state
            onOpenDM(dmUsername)
          } else {
            console.error(`Failed to load private messages: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error('Failed to load private messages:', error)
        }
      }
      
      loadMessages()
    }
  }, [dmUsername, username, onOpenDM])

  // Debug: Monitor privateMessages changes
  useEffect(() => {
    if (dmUsername) {
      console.log(`🔄 ChatLayout privateMessages updated for ${dmUsername}:`, {
        messagesCount: privateMessages[dmUsername]?.length || 0,
        messages: privateMessages[dmUsername]
      })
    }
  }, [privateMessages, dmUsername])
  
  const handleOpenDM = (otherUser) => {
    navigate(`/dm/${otherUser}`)
  }
  
  const handleBackToGeneral = () => {
    navigate('/general')
  }
  
  return (
    <div className="chat-layout">
      <Sidebar 
        users={onlineUsers} 
        currentUser={username} 
        activeDM={dmUsername} 
        onSelectUser={handleOpenDM} 
        loading={loading}
      />
      <main className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            {currentRoute === 'general' ? (
              <>
                <div className="chat-header-icon">#</div>
                <div className="chat-header-info">
                  <h2>general</h2>
                  <span className="chat-header-subtitle">General chat for everyone</span>
                </div>
              </>
            ) : (
              <>
                <div className="chat-header-icon">@</div>
                <div className="chat-header-info">
                  <h2>{dmUsername}</h2>
                  <span className="chat-header-subtitle">Direct message</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="back-button"
                    onClick={handleBackToGeneral}
                  >
                    ← Back to General
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="connection-status">
            <div className={`status-indicator ${connected ? 'online' : 'offline'}`}></div>
            <span>{connecting ? 'Connecting...' : (connected ? 'Connected' : 'Disconnected')}</span>
            <button 
              onClick={onLogout}
              className="back-button"
              style={{ marginLeft: '1rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        </div>
        
        <div className="chat-content">
          {currentRoute === 'general' ? (
            <GlobalChat 
              messages={globalMessages} 
              currentUser={username}
              loading={loading}
              onRetry={onRetryMessages}
            />
          ) : (
            <DirectChat 
              peer={dmUsername} 
              messages={privateMessages[dmUsername] || []} 
              currentUser={username}
              message={message}
              setMessage={setMessage}
              onSendPrivate={() => onSendPrivate && onSendPrivate(dmUsername)}
            />
          )}
        </div>
        
        {currentRoute === 'general' && (
          <div className="message-composer">
            <div className="composer-wrapper">
              <input
                type="text"
                placeholder="Message #general"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSendGlobal()}
                className="message-input"
                disabled={!connected || loading}
              />
              <button 
                onClick={onSendGlobal}
                className="send-button"
                disabled={!message.trim() || !connected || loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ChatLayout


