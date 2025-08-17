import React from 'react'
import { MessageItem, useAutoScroll } from './MessageUtils'

function DirectChat({ peer, messages, currentUser, message, setMessage, onSendPrivate }) {
  const messagesEndRef = useAutoScroll(messages)

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
            
            {messages.map((msg, idx) => (
              <div key={`${msg.sender}-${msg.timestamp}-${idx}`} className={`message-wrapper ${msg.sender === currentUser ? 'own-message' : ''}`}>
                <MessageItem message={msg} currentUser={currentUser} />
              </div>
            ))}
            
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


