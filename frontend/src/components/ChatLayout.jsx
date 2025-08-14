import React from 'react'
import Sidebar from './Sidebar'
import GlobalChat from './GlobalChat'
import DirectChat from './DirectChat'

function ChatLayout({
  username,
  connected,
  onlineUsers,
  activeDM,
  setActiveDM,
  globalMessages,
  privateMessages,
  message,
  setMessage,
  onSendGlobal,
  onSendPrivate,
}) {
  return (
    <div className="chat">
      <header className="chat-header">
        <div>
          <strong>{username}</strong>
          {activeDM && (
            <span 
              style={{ 
                marginLeft: '10px', 
                fontSize: '12px', 
                color: '#a3a3a3',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={() => setActiveDM('')}
            >
              ← Back to Global Chat
            </span>
          )}
        </div>
        <div className={connected ? 'status online' : 'status offline'}>{connected ? 'Connected' : 'Disconnected'}</div>
      </header>
      <div className="content">
        <Sidebar users={onlineUsers} currentUser={username} activeDM={activeDM} onSelectUser={setActiveDM} />
        <main className="messages">
          {!activeDM ? (
            <GlobalChat messages={globalMessages} />
          ) : (
            <DirectChat peer={activeDM} messages={privateMessages[activeDM]} currentUser={username} />
          )}
          <div className="composer">
            <input
              placeholder={activeDM ? `Message ${activeDM}` : 'Message everyone'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (activeDM ? onSendPrivate() : onSendGlobal())}
            />
            <button onClick={activeDM ? onSendPrivate : onSendGlobal}>{activeDM ? 'Send DM' : 'Send'}</button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChatLayout


