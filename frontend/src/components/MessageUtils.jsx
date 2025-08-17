import React from 'react'


export const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


export const MessageItem = ({ message, currentUser }) => {
  if (message.sender === 'System' || message.messageType === 'SYSTEM') {
    return (
      <div className="system-message">
        <div className="system-icon">ℹ️</div>
        <span>{message.content}</span>
      </div>
    )
  }



  return (
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
  )
}


export const useAutoScroll = (messages) => {
  const messagesEndRef = React.useRef(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  React.useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  return messagesEndRef
}
