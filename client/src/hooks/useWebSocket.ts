import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  payload: any;
};

type WebSocketHookReturn = {
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  readyState: number;
  connecting: boolean;
  connected: boolean;
};

export default function useWebSocket(): WebSocketHookReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Function to create WebSocket connection
  const createWebSocketConnection = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setReadyState(WebSocket.OPEN);
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        setLastMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setReadyState(WebSocket.CLOSED);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          createWebSocketConnection();
        }
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setReadyState(WebSocket.CLOSED);
    };
    
    socketRef.current = socket;
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    createWebSocketConnection();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [createWebSocketConnection]);
  
  // Function to send messages
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, []);
  
  return {
    sendMessage,
    lastMessage,
    readyState,
    connecting: readyState === WebSocket.CONNECTING,
    connected: readyState === WebSocket.OPEN
  };
}