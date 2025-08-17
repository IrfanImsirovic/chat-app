# Testing the Notification System

## 🔍 **Debugging Steps**

### **1. Check Backend Logs**
Look for these log messages in your Spring Boot console:
- "Sending global message notifications to X users"
- "Sending notification to user: [username]"
- "Sending private message notification to: [username]"
- "Notification sent to [username]: [content]"

### **2. Check Frontend Console**
Open browser developer tools and look for:
- "WebSocket STOMP connection established for user: [username]"
- "NotificationSystem: Setting up event listener for chatNotification events"
- "Received notification via WebSocket: [notification]"
- "Received notification via backup topic: [notification]"

### **3. Test Manual Notification**
Use this curl command to test if notifications work:
```bash
curl -X POST "http://localhost:8080/api/notifications/test/[YOUR_USERNAME]"
```

### **4. Test WebSocket Connection**
Check if the WebSocket connection is established:
- Look for "Connected" status in the chat header
- Check browser Network tab for WebSocket connections

## 🚨 **Common Issues & Solutions**

### **Issue: No notifications received**
**Possible causes:**
1. WebSocket not connected
2. User destination prefix not working
3. Notification service not being called
4. Frontend event listener not set up

**Solutions:**
1. Check WebSocket connection status
2. Verify backend logs show notifications being sent
3. Check frontend console for errors
4. Test with manual notification endpoint

### **Issue: Notifications sent but not received**
**Possible causes:**
1. Frontend subscription not working
2. Event listener not properly set up
3. Custom event not being dispatched

**Solutions:**
1. Check if `/user/queue/notifications` subscription is working
2. Verify custom events are being dispatched
3. Check if backup topic subscription works

## 🧪 **Testing Scenarios**

### **Test 1: Global Message Notifications**
1. Open chat in two different browsers/users
2. Send a message in the general chat from User A
3. Check if User B receives a notification
4. Look for backend logs showing notification being sent

### **Test 2: Private Message Notifications**
1. Send a private message from User A to User B
2. Check if User B receives a notification
3. Verify the notification appears in the notification panel

### **Test 3: Manual Notification Test**
1. Use the test endpoint to send a manual notification
2. Check if it appears in real-time
3. Verify WebSocket delivery

## 📊 **Expected Behavior**

### **When Working Correctly:**
- ✅ Backend logs show notifications being sent
- ✅ Frontend receives WebSocket messages
- ✅ Custom events are dispatched
- ✅ NotificationSystem component receives events
- ✅ Toast notifications appear
- ✅ Unread count increases
- ✅ Notification bell shows badge

### **When Not Working:**
- ❌ No backend logs for notifications
- ❌ Frontend doesn't receive WebSocket messages
- ❌ Custom events not dispatched
- ❌ No toast notifications
- ❌ Unread count doesn't increase

## 🔧 **Troubleshooting Commands**

### **Check if notifications table exists:**
```sql
SELECT * FROM notifications LIMIT 5;
```

### **Check WebSocket connection:**
Look for "Connected" status in chat header

### **Check browser console:**
Look for WebSocket connection and notification logs

### **Check backend console:**
Look for notification service logs

## 📝 **Next Steps**

1. **Run the application** and check all logs
2. **Test with manual notification** endpoint
3. **Send test messages** between users
4. **Check browser console** for WebSocket activity
5. **Verify notification bell** appears and works

If you're still not receiving notifications, please share:
- Backend console logs
- Frontend browser console logs
- WebSocket connection status
- Any error messages
