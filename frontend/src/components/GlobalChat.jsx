import React from 'react'

function GlobalChat({ messages }) {
  return (
    <>
      <h3>Global Chat</h3>
      <div className="message-list">
        {messages.map((m, idx) => (
          <div key={idx} className="message">
            <span className="sender">{m.sender}</span>: <span>{m.content}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export default GlobalChat


