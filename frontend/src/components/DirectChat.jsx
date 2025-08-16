import React, { useEffect, useRef } from 'react'

function DirectChat({ peer, messages, currentUser, message, setMessage, onSendPrivate }) {
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

  
  console.log(`DirectChat render for ${peer}:`, {
    messagesCount: messages?.length || 0,
    messages: messages,
    currentUser: currentUser
  })

  return (
    <div className="direct-chat">
      <div className="messages-container">
        {(!messages || messages.length === 0) ? (
          <div className="welcome-message">
            <div className="welcome-icon">💬</div>
            <h3>Start a conversation with {peer}</h3>
            <p>This is the beginning of your direct message history with {peer}.</p>
            <p className="welcome-note">Private messages are only visible to you and {peer}.</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <span className="message-count">{messages.length} messages</span>
            </div>
            
            {messages.map((msg, idx) => {
              
              console.log(` Rendering private message ${idx}:`, {
                sender: msg.sender,
                type: msg.messageType,
                content: msg.content?.substring(0, 30) + '...',
                timestamp: msg.timestamp
              })
              
              return (
                <div key={`${msg.sender}-${msg.timestamp}-${idx}`} className={`message-wrapper ${msg.sender === currentUser ? 'own-message' : ''}`}>
                  {(msg.sender === 'System' || msg.messageType === 'SYSTEM') ? (
                    <div className="system-message">
                      <div className="system-icon">ℹ️</div>
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div className="message">
                      <div className="message-avatar">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">{msg.sender}</span>
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="message-text">{msg.content}</div>
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
      
      <div className="message-composer">
        <div className="composer-wrapper">
          <input
            type="text"
            placeholder={`Message @${peer}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendPrivate()}
            className="message-input"
          />
          <button 
            onClick={onSendPrivate}
            className="send-button"
            disabled={!message.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DirectChat


