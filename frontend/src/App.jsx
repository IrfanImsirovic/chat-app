import { useEffect, useRef, useState } from 'react'
import './App.css'
import axios from 'axios'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import ChatLayout from './components/ChatLayout.jsx'

const API_BASE = 'http://localhost:8080'

function App() {
  const generateRandomName = () => {
    const adjectives = ['Happy','Clever','Brave','Wise','Swift','Bright','Calm','Eager','Friendly','Gentle','Kind','Lucky','Mighty','Noble','Proud']
    const nouns = ['Tiger','Eagle','Lion','Wolf','Bear','Fox','Hawk','Dragon','Phoenix','Warrior','Knight','Wizard','Archer','Mage','Hero','Champion']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 999) + 1
    return `${adj}${noun}${num}`
  }
  
  // Use localStorage to persist username
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem('chat-username')
    return saved || generateRandomName()
  })
  
  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem('chat-username', username)
    }
  }, [username])
  
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [globalMessages, setGlobalMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [message, setMessage] = useState('')
  const [activeDM, setActiveDM] = useState('')
  const clientRef = useRef(null)

  // Debug: show if username is set
  console.log('App render - username:', username, 'connected:', connected)

  useEffect(() => {
    if (!username) return
    
    setConnecting(true)
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws?username=${encodeURIComponent(username)}`),
      reconnectDelay: 1000,
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body)
        setConnecting(false)
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error', event)
        setConnecting(false)
      },
      onConnect: () => {
        console.log('STOMP connected!')
        setConnected(true)
        setConnecting(false)
        client.subscribe('/topic/global', (frame) => {
          const msg = JSON.parse(frame.body)
          console.log('Received global message:', msg)
          setGlobalMessages((prev) => [...prev, msg])
        })
        client.subscribe('/topic/online-users', (frame) => {
          const users = JSON.parse(frame.body)
          console.log('Received online users update:', users)
          setOnlineUsers(users)
        })
        client.subscribe('/user/queue/private', (frame) => {
          const msg = JSON.parse(frame.body)
          console.log('Received private message:', msg)
          const other = msg.sender === username ? msg.recipient : msg.sender
          setPrivateMessages((prev) => ({
            ...prev,
            [other]: [...(prev[other] || []), msg]
          }))
        })
        client.subscribe('/user/queue/notifications', (frame) => {
          const msg = JSON.parse(frame.body)
          console.log('Received notification:', msg)
          setGlobalMessages((prev) => [...prev, msg])
        })
        client.publish({ destination: '/app/chat.addUser', body: JSON.stringify({ sender: username, content: `${username} joined` }) })
      },
      onDisconnect: () => {
        setConnected(false)
        setConnecting(false)
      },
    })
    clientRef.current = client
    client.activate()
    
    // preload data
    axios.get(`${API_BASE}/api/messages/recent`).then((res) => {
      console.log('Loaded recent messages:', res.data)
      setGlobalMessages(res.data.reverse())
    }).catch((err) => console.error('Failed to load messages:', err))
    
    axios.get(`${API_BASE}/api/users/online`).then((res) => {
      console.log('Loaded online users:', res.data)
      setOnlineUsers(res.data)
    }).catch((err) => console.error('Failed to load users:', err))
    
    return () => {
      if (clientRef.current?.active) clientRef.current.deactivate()
    }
  }, [username])

  // username is generated synchronously at first render

  const sendGlobal = () => {
    if (!message.trim()) return
    clientRef.current?.publish({ destination: '/app/chat.send', body: JSON.stringify({ sender: username, content: message }) })
    setMessage('')
  }

  const sendPrivate = () => {
    if (!message.trim() || !activeDM) return
    clientRef.current?.publish({ destination: '/app/chat.private', body: JSON.stringify({ sender: username, recipient: activeDM, content: message }) })
    setMessage('')
  }

  const openDM = async (other) => {
    setActiveDM(other)
    const { data } = await axios.get(`${API_BASE}/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(other)}`)
    setPrivateMessages((prev) => ({ ...prev, [other]: data }))
  }

  return (
    <div className="container">
      <div style={{ color: 'white', padding: '20px', background: 'red', border: '2px solid yellow' }}>
        <h1>Debug: App is loading</h1>
        <div style={{ marginBottom: '10px' }}>
          <label>Username: </label>
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px 8px', background: '#374151', color: 'white', border: '1px solid #4b5563', borderRadius: '4px' }}
          />
        </div>
        <p>Status: {connecting ? 'Connecting...' : (connected ? 'Connected' : 'Disconnected')}</p>
        <p>Online users: {onlineUsers.length}</p>
        <p>Global messages: {globalMessages.length}</p>
        <p>Username state: {username}</p>
        <p>Connected state: {connected}</p>
        <p>Connecting state: {connecting}</p>
        <button 
          onClick={() => {
            axios.get(`${API_BASE}/api/users/reset-offline`)
              .then(() => window.location.reload())
              .catch(err => console.error('Failed to reset users:', err))
          }}
          style={{ marginTop: '10px', padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Reset All Users to Offline
        </button>
        <button 
          onClick={() => {
            console.log('Testing connection to backend...')
            axios.get(`${API_BASE}/test`)
              .then(res => console.log('Backend test response:', res.data))
              .catch(err => console.error('Backend test failed:', err))
          }}
          style={{ marginTop: '10px', marginLeft: '10px', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Test Backend Connection
        </button>
      </div>
      
      {/* Simple test div to see if React is working */}
      <div style={{ color: 'white', background: 'blue', padding: '20px', margin: '20px 0' }}>
        <h2>React Test - If you see this, React is working</h2>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
        <p>Random number: {Math.random()}</p>
      </div>
      
      {username && (
        <ChatLayout
          username={username}
          connected={connected}
          onlineUsers={onlineUsers}
          activeDM={activeDM}
          setActiveDM={(u) => openDM(u)}
          globalMessages={globalMessages}
          privateMessages={privateMessages}
          message={message}
          setMessage={setMessage}
          onSendGlobal={sendGlobal}
          onSendPrivate={sendPrivate}
        />
      )}
    </div>
  )
}

export default App
