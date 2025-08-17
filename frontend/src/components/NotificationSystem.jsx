import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationSystem.css';

const NotificationSystem = ({ username, connected }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  const navigate = useNavigate();
  const toastTimeoutRef = useRef(null);

  
  const loadNotifications = async () => {
    if (!username || !connected) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notifications/${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  
  const loadUnreadCount = async () => {
    if (!username || !connected) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notifications/${encodeURIComponent(username)}/unread/count`);
      if (response.ok) {
        const count = await response.json();
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  
  const markAsRead = async (chatId) => {
    if (!username || !connected) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notifications/${encodeURIComponent(username)}/read/${encodeURIComponent(chatId)}`, {
        method: 'POST'
      });
      
      
      setNotifications(prev => 
        prev.map(n => 
          n.chatId === chatId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  
  const markAllAsRead = async () => {
    if (!username || !connected) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/notifications/${encodeURIComponent(username)}/read-all`, {
        method: 'POST'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  
  const handleNotificationClick = (notification) => {
    
    if (!notification.read) {
      markAsRead(notification.chatId);
    }
    
    
    if (notification.chatType === 'PRIVATE') {
      navigate(`/dm/${notification.chatId}`);
    } else if (notification.chatType === 'GLOBAL') {
      navigate('/general');
    }
    
    
    setShowNotifications(false);
  };

  
  const showToastNotification = (notification) => {
    setCurrentToast(notification);
    setShowToast(true);
    
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setCurrentToast(null);
    }, 5000);
  };

  
  useEffect(() => {
    if (!connected) return;

    const handleWebSocketNotification = (event) => {
      try {
        const notification = event.detail;
        console.log('NotificationSystem: Received notification via custom event:', notification);
        
        
        setNotifications(prev => [notification, ...prev]);
        
        
        if (!notification.read) {
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('NotificationSystem: Updated unread count from', prev, 'to', newCount);
            return newCount;
          });
        }
        
        
        showToastNotification(notification);
        
        
        setTimeout(() => {
          loadNotifications();
          loadUnreadCount();
        }, 200);
        
      } catch (error) {
        console.error('NotificationSystem: Error processing notification:', error);
      }
    };

    console.log('NotificationSystem: Setting up event listener for chatNotification events');
    
    
    window.addEventListener('chatNotification', handleWebSocketNotification);
    
    return () => {
      console.log('NotificationSystem: Removing event listener for chatNotification events');
      window.removeEventListener('chatNotification', handleWebSocketNotification);
    };
  }, [connected]);

  
  useEffect(() => {
    if (!connected || !username) return;
    
    
    loadNotifications();
    loadUnreadCount();
    
    
    const pollInterval = setInterval(() => {
      console.log('NotificationSystem: Auto-polling for notifications every 2 seconds');
      loadNotifications();
      loadUnreadCount();
    }, 2000); // Poll every 2 seconds
    
    
    const countInterval = setInterval(() => {
      loadUnreadCount();
    }, 500); // Poll count every 500ms
    
    
    const backgroundInterval = setInterval(() => {
      loadUnreadCount();
    }, 1000); // Every 1 second for background updates
    
    return () => {
      clearInterval(pollInterval);
      clearInterval(countInterval);
      clearInterval(backgroundInterval);
    };
  }, [connected, username]);

  
  useEffect(() => {
    if (!connected) return;
    
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab became visible, auto-refreshing notifications');
        loadNotifications();
        loadUnreadCount();
      }
    };
    
   
    const handleFocus = () => {
      console.log('Window focused, auto-refreshing notifications');
      loadNotifications();
      loadUnreadCount();
    };
    
    
    const handleOnline = () => {
      console.log('Network online, auto-refreshing notifications');
      loadNotifications();
      loadUnreadCount();
    };
    
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [connected]);
  
 
  useEffect(() => {
    if (connected) {
      console.log('WebSocket connected, refreshing notifications');
      loadNotifications();
      loadUnreadCount();
    }
  }, [connected]);

  if (!username) return null;

  return (
    <div className="notification-system">
      {/* Notification Bell */}
      <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-sender">{notification.sender}</div>
                    <div className="notification-text">{notification.content}</div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && currentToast && (
        <div className="toast-notification" onClick={() => handleNotificationClick(currentToast)}>
          <div className="toast-header">
            <span className="toast-sender">{currentToast.sender}</span>
            <button 
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowToast(false);
                setCurrentToast(null);
              }}
            >
              ×
            </button>
          </div>
          <div className="toast-content">{currentToast.content}</div>
          <div className="toast-time">
            {new Date(currentToast.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
