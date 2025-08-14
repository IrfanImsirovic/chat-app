import React from 'react'

function Sidebar({ users, currentUser, activeDM, onSelectUser }) {
  return (
    <aside className="sidebar">
      <h3>Online Users</h3>
      <ul>
        {users.filter(u => u.username !== currentUser).map(u => (
          <li key={u.id || u.username} className={activeDM === u.username ? 'active' : ''} onClick={() => onSelectUser(u.username)}>
            {u.username}
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar


