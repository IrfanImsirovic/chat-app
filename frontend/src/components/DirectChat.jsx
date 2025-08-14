import React from 'react'

function DirectChat({ peer, messages, currentUser }) {
  return (
    <>
      <h3>DM with {peer}</h3>
      <div className="message-list">
        {(messages || []).map((m, idx) => (
          <div key={idx} className={`message ${m.sender === currentUser ? 'mine' : ''}`}>
            <span className="sender">{m.sender}</span>: <span>{m.content}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default DirectChat


