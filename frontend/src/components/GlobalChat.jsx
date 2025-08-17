import React from 'react'
import { MessageItem, useAutoScroll } from './MessageUtils'

function GlobalChat({ messages, currentUser, loading, onRetry }) {
  const messagesEndRef = useAutoScroll(messages)

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
            
            {messages.map((message, index) => (
              <div key={index} className={`message-wrapper ${message.sender === currentUser ? 'own-message' : ''}`}>
                <MessageItem message={message} currentUser={currentUser} />
              </div>
            ))}
            
            {/* Scroll anchor for auto-scroll */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  )
}

export default GlobalChat


