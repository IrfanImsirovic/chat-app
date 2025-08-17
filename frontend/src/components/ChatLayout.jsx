import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from './Sidebar'
import GlobalChat from './GlobalChat'
import DirectChat from './DirectChat'
import NotificationSystem from './NotificationSystem'

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
  currentRoute,
  dmUsername,
  onBackToGeneral
}) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setSidebarOpen(false)
    }
  }
  
  
  useEffect(() => {
    if (dmUsername && username) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(dmUsername)}`)
          if (response.ok) {
            const data = await response.json()
            onOpenDM(dmUsername)
          }
        } catch (error) {
          
        }
      }
      
      loadMessages()
    }
  }, [dmUsername, username, onOpenDM])

  

  
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="chat-main">
        <div className="chat-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
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
          <div className="header-actions">
            <NotificationSystem username={username} connected={connected} />
            <div className="connection-status">
              <div className={`status-indicator ${connected ? 'online' : 'offline'}`}></div>
              <span>{connecting ? 'Connecting...' : (connected ? 'Connected' : 'Disconnected')}</span>
            </div>
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
              onSendPrivate={() => onSendPrivate(dmUsername)}
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


