import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import axios from 'axios'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import ChatLayout from './components/ChatLayout'

const API_BASE = 'http://localhost:8080'


function DirectChatWrapper({ username, connected, connecting, loading, onlineUsers, globalMessages, privateMessages, message, setMessage, onSendGlobal, onSendPrivate, onRetryMessages, onOpenDM, onTestWebSocket }) {
  const { dmUsername } = useParams()
  const navigate = useNavigate()
  
  return (
    <ChatLayout
      username={username}
      connected={connected}
      connecting={connecting}
      loading={loading}
      onlineUsers={onlineUsers}
      globalMessages={globalMessages}
      privateMessages={privateMessages}
      message={message}
      setMessage={setMessage}
      onSendGlobal={onSendGlobal}
      onSendPrivate={onSendPrivate}
      onRetryMessages={onRetryMessages}
      onOpenDM={onOpenDM}
      onTestWebSocket={onTestWebSocket}
      currentRoute="dm"
      dmUsername={dmUsername}
      onBackToGeneral={() => navigate('/general')}

    />
  )
}


function ChatApp() {
  const [globalMessages, setGlobalMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [message, setMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const clientRef = useRef(null)

  const generateRandomName = () => {
    const adjectives = ['Happy','Clever','Brave','Wise','Swift','Bright','Calm','Eager','Friendly','Gentle','Kind','Lucky','Mighty','Noble','Proud']
    const nouns = ['Tiger','Eagle','Lion','Wolf','Bear','Fox','Hawk','Dragon','Phoenix','Warrior','Knight','Wizard','Archer','Mage','Hero','Champion']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 999) + 1
    return `${adj}${noun}${num}`
  }
  
  
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem('chat-username')
    return saved || generateRandomName()
  })
  
  
  useEffect(() => {
    if (username) {
      localStorage.setItem('chat-username', username)
    }
  }, [username])
  
  

  
  
  const loadGlobalMessages = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE}/api/messages/all`)
      console.log(`Loaded ${response.data.length} global messages`)
      
      
      const messageTypes = response.data.map(msg => ({
        sender: msg.sender,
        type: msg.messageType,
        content: msg.content?.substring(0, 50) + '...'
      }))
      console.log('Message types breakdown:', messageTypes)
      
      setGlobalMessages(response.data)
    } catch (err) {
      console.error('Failed to load global messages:', err)
      setError('Failed to load messages. Please refresh the page.')
      
      
      if (retryCount < 3) {
        setTimeout(() => loadGlobalMessages(retryCount + 1), 1000 * (retryCount + 1))
      }
    } finally {
      setLoading(false)
    }
  }

  
  const loadOnlineUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/online`)
      console.log('API response for online users:', response.data)
      setOnlineUsers(response.data)
    } catch (err) {
      console.error('Failed to load online users:', err)
    }
  }

  
  const loadPrivateMessages = async (otherUser) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(otherUser)}`)
      console.log(`Loaded ${data.length} private messages for ${otherUser}`)
      setPrivateMessages((prev) => ({ ...prev, [otherUser]: data }))
    } catch (err) {
      console.error('Failed to load private messages for', otherUser, ':', err)
      setPrivateMessages((prev) => ({ ...prev, [otherUser]: [] }))
    }
  }

  
  useEffect(() => {
    if (username) {
      
      const savedPrivateMessages = localStorage.getItem(`chat-private-${username}`)
      if (savedPrivateMessages) {
        try {
          const parsed = JSON.parse(savedPrivateMessages)
          setPrivateMessages(parsed)
        } catch (error) {
          console.error('Failed to parse saved private messages:', error)
        }
      }
    }
  }, [username])

  
  useEffect(() => {
    if (username && Object.keys(privateMessages).length > 0) {
      localStorage.setItem(`chat-private-${username}`, JSON.stringify(privateMessages))
    }
  }, [privateMessages, username])

  useEffect(() => {
    if (!username) return
    
    setConnecting(true)
    
    // Set up periodic refresh of online users every 30 seconds
    // This ensures the sidebar stays up-to-date even if WebSocket updates are missed
    const onlineUsersInterval = setInterval(() => {
      if (connected) {
        loadOnlineUsers()
      }
    }, 30000)
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws?username=${encodeURIComponent(username)}`),
      reconnectDelay: 1000,
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body)
        setConnecting(false)
        setError('Connection error. Please refresh the page.')
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error', event)
        setConnecting(false)
        setError('Connection error. Please refresh the page.')
      },
      onConnect: () => {
        setConnected(true)
        setConnecting(false)
        setError(null)
        console.log('WebSocket connected successfully for user:', username)
        
        
        client.subscribe('/topic/global', (frame) => {
          const msg = JSON.parse(frame.body)
          console.log('Received global message via WebSocket:', msg)
          console.log('Message sender:', msg.sender, 'Type:', msg.messageType, 'Content:', msg.content)
          
          
          if (msg.sender === 'System') {
            console.log('System message received:', msg.content)
          }
          
          setGlobalMessages((prev) => [...prev, msg])
        })
        
        client.subscribe('/topic/online-users', (frame) => {
          const users = JSON.parse(frame.body)
          console.log('Received online users update via WebSocket:', users)
          console.log('Setting onlineUsers state to:', users)
          setOnlineUsers(users)
        })
        
        
        client.subscribe('/user/queue/private', (frame) => {
          try {
            const msg = JSON.parse(frame.body)
            console.log(' Received private message via /user/queue/private:', msg)
            console.log('Message details:', {
              sender: msg.sender,
              recipient: msg.recipient,
              content: msg.content,
              type: msg.messageType,
              timestamp: msg.timestamp
            })
            
            
            if (msg.recipient === username || msg.sender === username) {
              const other = msg.sender === username ? msg.recipient : msg.sender
              if (other) {
                console.log(' Adding private message for conversation with:', other)
                setPrivateMessages((prev) => {
                  const currentMessages = prev[other] || []
                  
                  const messageExists = currentMessages.some(existing => 
                    existing.content === msg.content && 
                    existing.sender === msg.sender && 
                    existing.timestamp === msg.timestamp
                  )
                  
                  if (messageExists) {
                    console.log(' Message already exists, skipping duplicate')
                    return prev
                  }
                  
                  const updated = {
                    ...prev,
                    [other]: [...currentMessages, msg]
                  }
                  console.log(' Updated private messages state:', updated)
                  return updated
                })
              }
            } else {
              console.log(' Message not for current user:', {
                messageRecipient: msg.recipient,
                messageSender: msg.sender,
                currentUser: username
              })
            }
          } catch (error) {
            console.error(' Error processing private message:', error)
            console.error('Raw frame body:', frame.body)
          }
        })
        
        
        client.subscribe('/topic/private', (frame) => {
          try {
            const msg = JSON.parse(frame.body)
            console.log(' Received private message via /topic/private:', msg)
            
            
            if (msg.recipient === username || msg.sender === username) {
              const other = msg.sender === username ? msg.recipient : msg.sender
              if (other) {
                console.log(' Adding private message via fallback subscription for:', other)
                setPrivateMessages((prev) => {
                  const currentMessages = prev[other] || []
                  
                  const messageExists = currentMessages.some(existing => 
                    existing.content === msg.content && 
                    existing.sender === msg.sender && 
                    existing.timestamp === msg.timestamp
                  )
                  
                  if (messageExists) {
                    console.log(' Message already exists in fallback, skipping duplicate')
                    return prev
                  }
                  
                  return {
                    ...prev,
                    [other]: [...currentMessages, msg]
                  }
                })
              }
            }
          } catch (error) {
            console.error(' Error processing fallback private message:', error)
          }
        })
        
        
        client.publish({ destination: '/app/chat.addUser', body: JSON.stringify({ sender: username, content: `${username} joined` }) })
        
        
        loadGlobalMessages()
        loadOnlineUsers()
        
        
        console.log('Testing WebSocket private messaging setup...')
        console.log('Subscribed to /user/queue/private for user:', username)
        console.log('Subscribed to /topic/private as fallback')
        
        
        setTimeout(() => {
          if (clientRef.current?.active) {
            console.log(' WebSocket is active and ready for private messaging')
            console.log('Current subscriptions:', clientRef.current.subscriptions)
          } else {
            console.error(' WebSocket is not active!')
          }
        }, 1000)
      },
      onDisconnect: () => {
        setConnected(false)
        setConnecting(false)
        setError('Connection lost. Attempting to reconnect...')
        
        // Refresh online users when disconnection happens
        // This ensures the sidebar updates when users go offline
        setTimeout(() => {
          loadOnlineUsers()
        }, 1000) // Small delay to ensure backend has processed the disconnect
      },
    })
    clientRef.current = client
    client.activate()
    
    return () => {
      if (clientRef.current?.active) clientRef.current.deactivate()
      clearInterval(onlineUsersInterval)
    }
  }, [username])

  const sendGlobal = () => {
    if (!message.trim()) return
    clientRef.current?.publish({ destination: '/app/chat.send', body: JSON.stringify({ sender: username, content: message }) })
    setMessage('')
  }

  const sendPrivate = (recipient) => {
    if (!message.trim() || !recipient) return
    
    const messageData = { 
      sender: username, 
      recipient: recipient, 
      content: message.trim(),
      timestamp: new Date().toISOString(),
      messageType: 'PRIVATE'
    }
    
    console.log(' Sending private message:', messageData)
    console.log('WebSocket status:', {
      clientExists: !!clientRef.current,
      isActive: clientRef.current?.active,
      subscriptions: clientRef.current?.subscriptions
    })
    
    
    setPrivateMessages((prev) => {
      const currentMessages = prev[recipient] || []
      const updated = {
        ...prev,
        [recipient]: [...currentMessages, messageData]
      }
      console.log(' Updated local private messages:', updated)
      return updated
    })
    
    
    try {
      if (clientRef.current?.active) {
        clientRef.current.publish({ 
          destination: '/app/chat.private', 
          body: JSON.stringify(messageData) 
        })
        console.log(' Private message sent via WebSocket to:', recipient)
      } else {
        console.error(' WebSocket not active, cannot send message')
      }
    } catch (error) {
      console.error(' Failed to send private message via WebSocket:', error)
    }
    
    setMessage('')
  }

  const openDM = async (other) => {
    try {
      console.log(` Opening DM with ${other}`)
      const { data } = await axios.get(`${API_BASE}/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(other)}`)
      console.log(` Loaded ${data.length} private messages for ${other}:`, data)
      
      
      setPrivateMessages((prev) => {
        const updated = { ...prev, [other]: data }
        console.log(' Updated private messages state:', updated)
        return updated
      })
    } catch (err) {
      console.error(' Failed to load private messages:', err)
      setPrivateMessages((prev) => ({ ...prev, [other]: [] }))
    }
  }

  const retryConnection = () => {
    setError(null)
    if (clientRef.current) {
      clientRef.current.activate()
    }
  }

  
  const testWebSocketPrivate = (recipient) => {
    if (!recipient || !clientRef.current?.active) {
      console.error('Cannot test: No recipient or WebSocket not connected')
      return
    }
    
    const testMessage = {
      sender: username,
      recipient: recipient,
      content: 'WebSocket test message - ' + new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
      messageType: 'PRIVATE'
    }
    
    console.log('Sending test private message:', testMessage)
    
    try {
      clientRef.current.publish({
        destination: '/app/chat.private',
        body: JSON.stringify(testMessage)
      })
      console.log(' Test message sent via WebSocket')
    } catch (error) {
      console.error(' Failed to send test message:', error)
    }
  }

  // Debug: Log current state
  console.log('ChatApp render - onlineUsers:', onlineUsers, 'username:', username, 'connected:', connected)
  
  return (
    <Router>
      <div className="app">

          <>
            {error && (
              <div className="error-banner">
                <span>{error}</span>
                <button onClick={retryConnection}>Retry</button>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Navigate to="/general" replace />} />
              <Route 
                path="/general" 
                element={
                  <ChatLayout
                    username={username}
                    connected={connected}
                    connecting={connecting}
                    loading={loading}
                    onlineUsers={onlineUsers}
                    globalMessages={globalMessages}
                    privateMessages={privateMessages}
                    message={message}
                    setMessage={setMessage}
                    onSendGlobal={sendGlobal}
                    onSendPrivate={sendPrivate}
                    onRetryMessages={loadGlobalMessages}
                    onOpenDM={openDM}
                    onTestWebSocket={testWebSocketPrivate}
                    currentRoute="general"
                  />
                } 
              />
              <Route 
                path="/dm/:dmUsername" 
                element={
                  <DirectChatWrapper
                    username={username}
                    connected={connected}
                    connecting={connecting}
                    loading={loading}
                    onlineUsers={onlineUsers}
                    globalMessages={globalMessages}
                    privateMessages={privateMessages}
                    message={message}
                    setMessage={setMessage}
                    onSendGlobal={sendGlobal}
                    onSendPrivate={sendPrivate}
                    onRetryMessages={loadGlobalMessages}
                    onOpenDM={openDM}
                    onTestWebSocket={testWebSocketPrivate}
                  />
                } 
              />
            </Routes>
                      </>
        </div>
      </Router>
  )
}


function App() {
  return (
    <ChatApp />
  )
}

export default App
