import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

/**
 * SocketProvider - Global WebSocket connection manager
 * Establishes socket connection on user authentication
 * Disconnects on logout or component unmount
 */
export const SocketProvider = ({ children }) => {
    const { user, isLoaded: isUserLoaded } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const socketRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        // Only connect if user is loaded, signed in, and we don't have an active socket
        if (!isUserLoaded || !isSignedIn || !user || socketRef.current) {
            return;
        }

        const connectSocket = async () => {
            try {
                console.log('🔌 Initializing socket connection...');
                const token = await getToken();

                if (!token) {
                    console.error('❌ No token available for socket authentication');
                    setConnectionError('No authentication token');
                    return;
                }

                const backendUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

                // Create socket connection with authentication
                const newSocket = io(backendUrl, {
                    auth: {
                        token: token,
                    },
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: maxReconnectAttempts,
                });

                // Connection success
                newSocket.on('connect', () => {
                    console.log('✅ Socket connected successfully');
                    console.log(`   Socket ID: ${newSocket.id}`);
                    console.log(`   User: ${user.id}`);
                    setIsConnected(true);
                    setConnectionError(null);
                    reconnectAttemptsRef.current = 0;
                });

                // Connection error
                newSocket.on('connect_error', (error) => {
                    console.error('❌ Socket connection error:', error.message);
                    setIsConnected(false);
                    setConnectionError(error.message);
                    reconnectAttemptsRef.current++;

                    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                        console.error('❌ Max reconnection attempts reached');
                        newSocket.close();
                    }
                });

                // Disconnection
                newSocket.on('disconnect', (reason) => {
                    console.log('🔌 Socket disconnected:', reason);
                    setIsConnected(false);

                    if (reason === 'io server disconnect') {
                        // Server disconnected, need manual reconnect
                        console.log('🔄 Server initiated disconnect, attempting reconnect...');
                        newSocket.connect();
                    }
                });

                // Reconnection attempt
                newSocket.on('reconnect_attempt', (attemptNumber) => {
                    console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
                });

                // Reconnection success
                newSocket.on('reconnect', (attemptNumber) => {
                    console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
                    setIsConnected(true);
                    setConnectionError(null);
                    reconnectAttemptsRef.current = 0;
                });

                // Reconnection failed
                newSocket.on('reconnect_failed', () => {
                    console.error('❌ Socket reconnection failed');
                    setConnectionError('Reconnection failed');
                });

                socketRef.current = newSocket;
                setSocket(newSocket);

                console.log('✅ Socket initialization complete');
            } catch (error) {
                console.error('❌ Error initializing socket:', error);
                setConnectionError(error.message);
            }
        };

        connectSocket();

        // Cleanup on unmount or when user signs out
        return () => {
            if (socketRef.current) {
                console.log('🔌 Disconnecting socket...');
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
        };
    }, [isUserLoaded, isSignedIn, user, getToken]);

    const value = {
        socket,
        isConnected,
        connectionError,
        userId: user?.id || null,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * useSocket - Hook to access socket context
 * @returns {Object} - { socket, isConnected, connectionError, userId }
 */
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

/**
 * useVideoSocket - Hook for video upload status updates
 * Listens for real-time video status changes
 * 
 * @param {Function} onStatusUpdate - Callback when video status updates
 * @param {Function} onError - Callback on error
 * @returns {Object} - { isConnected, error }
 */
export const useVideoSocket = (onStatusUpdate, onError) => {
    const { socket, isConnected, connectionError } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) {
            return;
        }

        // Listen for video status updates
        const handleVideoStatusUpdate = (data) => {
            console.log('📡 Video status update:', data);
            if (onStatusUpdate) {
                onStatusUpdate(data);
            }
        };

        // Listen for video errors
        const handleVideoError = (data) => {
            console.error('❌ Video error:', data);
            if (onError) {
                onError(data);
            }
        };

        socket.on('videoStatusUpdate', handleVideoStatusUpdate);
        socket.on('videoError', handleVideoError);

        // Cleanup listeners on unmount
        return () => {
            socket.off('videoStatusUpdate', handleVideoStatusUpdate);
            socket.off('videoError', handleVideoError);
        };
    }, [socket, isConnected, onStatusUpdate, onError]);

    return {
        isConnected,
        error: connectionError,
    };
};

export default SocketContext;
