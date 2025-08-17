import React from 'react'

function Sidebar({ users, currentUser, activeDM, onSelectUser, loading, isOpen, onClose }) {
  const otherUsers = users.filter(user => user.username !== currentUser)
  
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
        <button 
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <h3>Online Users</h3>
        <span className="user-count">
          {loading ? 'Loading...' : `${otherUsers.length + 1} online`}
        </span>
      </div>
      
      <div className="current-user">
        <div className="user-avatar">
          {currentUser.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <span className="username">{currentUser}</span>
          <span className="user-status">Online</span>
        </div>
      </div>
      
      <div className="sidebar-divider"></div>
      
      <div className="users-list">
        {loading ? (
          <div className="loading-users">
            <div className="loading-spinner small"></div>
            <span>Loading users...</span>
          </div>
        ) : otherUsers.length === 0 ? (
          <div className="no-users">
            <p>No other users online</p>
            <span>Invite friends to start chatting!</span>
          </div>
        ) : (
          otherUsers.map((user) => (
            <div
              key={user.username}
              className={`user-item ${activeDM === user.username ? 'active' : ''}`}
              onClick={() => onSelectUser(user.username)}
            >
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="username">{user.username}</span>
                <span className="user-status">Online</span>
              </div>
              <div className="user-indicator">
                <div className="status-dot online"></div>
              </div>
            </div>
          ))
        )}
      </div>
        </div>
      </>
    )
  }

export default Sidebar


