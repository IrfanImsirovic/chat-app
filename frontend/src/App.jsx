import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import './App.css'
import axios from 'axios'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import ChatLayout from './components/ChatLayout'



const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'


function DirectChatWrapper({ 
  username, 
  connected, 
  connecting, 
  loading, 
  onlineUsers, 
  globalMessages, 
  privateMessages, 
  message, 
  setMessage, 
  onSendGlobal, 
  onSendPrivate, 
  onRetryMessages, 
  onOpenDM
}) {
  const { dmUsername } = useParams()
  const navigate = useNavigate()
  
  
  const handleSendPrivate = () => {
    if (dmUsername) {
      onSendPrivate(dmUsername)
    }
  }
  
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
      onSendPrivate={handleSendPrivate}
      onRetryMessages={onRetryMessages}
      onOpenDM={onOpenDM}
      currentRoute="dm"
      dmUsername={dmUsername}
      onBackToGeneral={() => navigate('/general')}
    />
  )
}


function ChatApp() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [globalMessages, setGlobalMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(false)
  

  
  const clientRef = useRef(null)
  const onlineUsersInterval = useRef(null)



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
  
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (username && connected) {
        
        navigator.sendBeacon(`${API_BASE}/api/users/disconnect/${encodeURIComponent(username)}`)
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [username, connected])
  
  

  
  
  const loadGlobalMessages = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE}/api/messages/all`)
      setGlobalMessages(response.data)
    } catch (err) {
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
      setOnlineUsers(response.data)
    } catch (err) {
      
    }
  }



  
  const loadPrivateMessages = async (otherUser) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/messages/private/${encodeURIComponent(username)}/${encodeURIComponent(otherUser)}`)
      setPrivateMessages((prev) => ({ ...prev, [otherUser]: data }))
    } catch (err) {
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
    
    
    onlineUsersInterval.current = setInterval(() => {
      if (connected) {
        loadOnlineUsers()
      }
    }, 60000)
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
        
        client.subscribe('/topic/global', (frame) => {
          const msg = JSON.parse(frame.body)
          console.log('Received global message:', msg)
          
          if (msg.messageType === 'GLOBAL' || msg.messageType === 'SYSTEM' || !msg.messageType) {
            setGlobalMessages((prev) => [...prev, msg])
            
            
          }
        })
        
        client.subscribe('/topic/online-users', (frame) => {
          const users = JSON.parse(frame.body)
          setOnlineUsers(users)
        })
        
        
        client.subscribe('/user/queue/private', (frame) => {
          try {
            const msg = JSON.parse(frame.body)
            console.log('Received private message:', msg)
            
            
            if (msg.recipient === username || msg.sender === username) {
              const other = msg.sender === username ? msg.recipient : msg.sender
              console.log('Processing private message from/to:', other)
              
              if (other) {
                
                setPrivateMessages((prev) => {
                  const currentMessages = prev[other] || []
                  
                  
                  const messageExists = currentMessages.some(existing => 
                    existing.content === msg.content && 
                    existing.sender === msg.sender && 
                    Math.abs(new Date(existing.timestamp) - new Date(msg.timestamp)) < 1000 // Within 1 second
                  )
                  
                  if (messageExists) {
                    console.log('Message already exists, skipping')
                    return prev
                  }
                  
                  console.log('Adding message to conversation with:', other)
                  const updatedMessages = [...currentMessages, msg]
                  
                  
                  updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  
                  return {
                    ...prev,
                    [other]: updatedMessages
                  }
                })
              }
            }
          } catch (error) {
            console.error('Error processing private message:', error)
          }
        })
        
        
        client.subscribe('/user/queue/notifications', (frame) => {
          try {
            const notification = JSON.parse(frame.body)
            console.log('Received notification via /user/queue/notifications:', notification)
            
           
            const event = new CustomEvent('chatNotification', { 
              detail: notification 
            })
            window.dispatchEvent(event)
            
          } catch (error) {
            console.error('Error processing notification:', error)
          }
        })
        
        
        client.subscribe('/topic/user/' + username + '/notifications', (frame) => {
          try {
            const notification = JSON.parse(frame.body)
            console.log('Received notification via /topic/user/' + username + '/notifications:', notification)
            
            
            const event = new CustomEvent('chatNotification', { 
              detail: notification 
            })
            window.dispatchEvent(event)
            
          } catch (error) {
            console.error('Error processing user topic notification:', error)
          }
        })
        
        
        client.subscribe('/topic/notifications', (frame) => {
          try {
            const data = JSON.parse(frame.body)
            console.log('Received notification via /topic/notifications:', data)
            
            
            if (data.recipient === username) {
              const notification = data.notification
              console.log('Processing global notification for current user:', notification)
              
              
              const event = new CustomEvent('chatNotification', { 
                detail: notification 
              })
              window.dispatchEvent(event)
            }
            
          } catch (error) {
            console.error('Error processing global notification:', error)
          }
        })
        
        
        client.subscribe('/topic/notifications-debug', (frame) => {
          try {
            const debugData = JSON.parse(frame.body)
            console.log('Debug notification data:', debugData)
          } catch (error) {
            console.error('Error processing debug notification:', error)
          }
        })
        

        
        
        console.log('WebSocket STOMP connection established for user:', username)
        
        
        loadPrivateChats()
        
        

        
        
        client.publish({ destination: '/app/chat.addUser', body: JSON.stringify({ sender: username, content: `${username} joined` }) })
        
        loadGlobalMessages()
        loadOnlineUsers()
      },
      onDisconnect: () => {
        setConnected(false)
        setConnecting(false)
        setError('Connection lost. Attempting to reconnect...')
        
       
        if (username) {
          try {
            fetch(`${API_BASE}/api/users/disconnect/${encodeURIComponent(username)}`, {
              method: 'POST'
            }).catch(() => {})
          } catch (error) {
            
          }
        }
        
        
        setTimeout(() => {
          loadOnlineUsers()
        }, 1000)
      },
    })
    clientRef.current = client
    client.activate()
    
    return () => {
      if (clientRef.current?.active) clientRef.current.deactivate()
      clearInterval(onlineUsersInterval.current)
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
    
    console.log('Sending private message to:', recipient, messageData)
    
    
    setPrivateMessages((prev) => {
      const currentMessages = prev[recipient] || []
      return {
        ...prev,
        [recipient]: [...currentMessages, messageData]
      }
    })
    
    try {
      if (clientRef.current?.active) {
        clientRef.current.publish({ 
          destination: '/app/chat.private', 
          body: JSON.stringify(messageData) 
        })
      }
    } catch (error) {
      console.error('Error sending private message:', error)
    }
    
    setMessage('')
  }

  const openDM = async (other) => {
    try {
      console.log('Opening DM with:', other)
      const { data } = await axios.get(`${API_BASE}/api/private-chat/${encodeURIComponent(username)}/${encodeURIComponent(other)}/messages`)
      
      console.log('Loaded private messages:', data)
      setPrivateMessages((prev) => ({ ...prev, [other]: data }))
    } catch (err) {
      console.error('Error loading private messages:', err)
      setPrivateMessages((prev) => ({ ...prev, [other]: [] }))
    }
  }
  
  
  const loadPrivateChats = async () => {
    try {
      console.log('Loading private chats for user:', username)
      const { data } = await axios.get(`${API_BASE}/api/private-chats/${encodeURIComponent(username)}`)
      console.log('Loaded private chats:', data)
      
      
      for (const chat of data) {
        const otherUser = chat.getOtherUser ? chat.getOtherUser(username) : 
                         (chat.user1.equals(username) ? chat.user2 : chat.user1)
        if (otherUser) {
          await openDM(otherUser)
        }
      }
    } catch (err) {
      console.error('Error loading private chats:', err)
    }
  }
  

  

  

  
  
  const sendGeneralTypingIndicator = async () => {
    try {
      await axios.post(`${API_BASE}/api/general-chat/typing`, null, {
        params: { sender: username }
      })
    } catch (err) {
      console.error('Error sending general typing indicator:', err)
    }
  }
  

  




  const retryConnection = () => {
    setError(null)
    if (clientRef.current) {
      clientRef.current.activate()
    }
  }

  



  

  
  return (
    <Router>
      <ChatAppWrapper 
        username={username}
        connected={connected}
        connecting={connecting}
        error={error}
        message={message}
        setMessage={setMessage}
        globalMessages={globalMessages}
        privateMessages={privateMessages}
        onlineUsers={onlineUsers}
        loading={loading}
        onSendGlobal={sendGlobal}
        onSendPrivate={sendPrivate}
        onRetryMessages={loadGlobalMessages}
        onOpenDM={openDM}
        retryConnection={retryConnection}

      />
    </Router>
  )
}

function ChatAppWrapper(props) {
  const navigate = useNavigate()
  


  return (
    <div className="app">

      <>
        {props.error && (
          <div className="error-banner">
            <span>{props.error}</span>
            <button onClick={props.retryConnection}>Retry</button>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Navigate to="/general" replace />} />
          <Route 
            path="/general" 
            element={
              <ChatLayout
                username={props.username}
                connected={props.connected}
                connecting={props.connecting}
                loading={props.loading}
                onlineUsers={props.onlineUsers}
                globalMessages={props.globalMessages}
                privateMessages={props.privateMessages}
                message={props.message}
                setMessage={props.setMessage}
                onSendGlobal={props.onSendGlobal}
                onSendPrivate={props.onSendPrivate}
                onRetryMessages={props.onRetryMessages}
                onOpenDM={props.onOpenDM}
                currentRoute="general"

              />
            } 
          />
          <Route 
            path="/dm/:dmUsername" 
            element={
              <DirectChatWrapper
                username={props.username}
                connected={props.connected}
                connecting={props.connecting}
                loading={props.loading}
                onlineUsers={props.onlineUsers}
                globalMessages={props.globalMessages}
                privateMessages={props.privateMessages}
                message={props.message}
                setMessage={props.setMessage}
                onSendGlobal={props.onSendGlobal}
                onSendPrivate={props.onSendPrivate}
                onRetryMessages={props.onRetryMessages}
                onOpenDM={props.onOpenDM}
              />
            } 
          />
        </Routes>
      </>
    </div>
  )
}


function App() {
  return (
    <ChatApp />
  )
}

export default App
