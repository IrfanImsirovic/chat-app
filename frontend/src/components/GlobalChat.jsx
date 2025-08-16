import React, { useEffect, useRef } from 'react'

function GlobalChat({ messages, currentUser, loading, onRetry }) {
  const messagesEndRef = useRef(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="global-chat">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">👋</div>
            <h3>Welcome to the general chat!</h3>
            <p>This is the beginning of the #general channel. Start the conversation!</p>
            <p className="welcome-note">All messages are saved and visible to new users, including messages from users who are no longer active.</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <span className="message-count">{messages.length} messages</span>
              <button 
                className="refresh-button"
                onClick={onRetry}
                title="Refresh messages"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
              </button>
            </div>
            
            {messages.map((message, index) => {
              
              console.log(`Rendering message ${index}:`, {
                sender: message.sender,
                type: message.messageType,
                content: message.content?.substring(0, 30) + '...'
              })
              
              return (
                <div key={index} className={`message-wrapper ${message.sender === currentUser ? 'own-message' : ''}`}>
                  {(message.sender === 'System' || message.messageType === 'SYSTEM') ? (
                    <div className="system-message">
                      <div className="system-icon">ℹ️</div>
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <div className="message">
                      <div className="message-avatar">
                        {message.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">{message.sender}</span>
                          <span className="message-time">{formatTime(message.timestamp)}</span>
                        </div>
                        <div className="message-text">{message.content}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Scroll anchor for auto-scroll */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  )
}

export default GlobalChat


