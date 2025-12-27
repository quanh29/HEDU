import React, { useState } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import styles from './Messaging.module.css';
import ConversationList from '../../components/Messaging/ConversationList/ConversationList';
import ChatWindow from '../../components/Messaging/ChatWindow/ChatWindow';
import { useSocket } from '../../context/SocketContext';
import { useUser } from '@clerk/clerk-react';

const MessagingPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { socket, isConnected, connectionError } = useSocket();
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle className={styles.errorIcon} />
          <p className={styles.errorMessage}>Vui lòng đăng nhập để sử dụng tính năng này</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {!isConnected && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#991b1b'
        }}>
          {connectionError 
            ? `Lỗi kết nối: ${connectionError}`
            : 'Đang kết nối đến máy chủ...'}
        </div>
      )}

      <div className={styles.messagingWrapper}>
        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />
        <ChatWindow conversation={selectedConversation} socket={socket} />
      </div>
    </div>
  );
};

export default MessagingPage;
