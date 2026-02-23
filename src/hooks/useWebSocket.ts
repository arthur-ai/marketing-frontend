/**
 * WebSocket hook for real-time updates
 *
 * This hook provides real-time communication with the backend via WebSocket.
 * It handles connection lifecycle, reconnection, and message broadcasting.
 *
 * Usage:
 * ```typescript
 * const { lastMessage, sendMessage, connectionStatus } = useWebSocket('/ws/jobs')
 *
 * useEffect(() => {
 *   if (lastMessage?.type === 'job_update') {
 *     // Handle job update
 *   }
 * }, [lastMessage])
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp?: string
}

export interface UseWebSocketOptions {
  // Reconnect automatically on disconnect
  autoReconnect?: boolean
  // Reconnect delay in milliseconds
  reconnectDelay?: number
  // Maximum number of reconnection attempts
  maxReconnectAttempts?: number
  // Callback when connection is established
  onOpen?: () => void
  // Callback when connection is closed
  onClose?: () => void
  // Callback when error occurs
  onError?: (error: Event) => void
  // Callback when message is received
  onMessage?: (message: WebSocketMessage) => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const socketRef = useRef<WebSocket | null>(null)

  // Get WebSocket URL from environment or construct it
  const getWebSocketUrl = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL || 'ws://localhost:8000'
    const wsUrl = `${baseUrl}${url}`
    console.log('[WebSocket] Connecting to:', wsUrl)
    return wsUrl
  }, [url])

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
      console.log('[WebSocket] Message sent:', message)
    } else {
      console.warn('[WebSocket] Cannot send message - socket not open')
    }
  }, [])

  // Close WebSocket connection
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    setSocket(null)
    setConnectionStatus('disconnected')
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
      return
    }

    setConnectionStatus('connecting')

    try {
      const ws = new WebSocket(getWebSocketUrl())
      socketRef.current = ws

      ws.onopen = () => {
        console.log('[WebSocket] Connection established')
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        setSocket(ws)
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          console.log('[WebSocket] Message received:', message)
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        setConnectionStatus('error')
        onError?.(error)
      }

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed')
        setConnectionStatus('disconnected')
        setSocket(null)
        socketRef.current = null
        onClose?.()

        // Auto-reconnect if enabled and under max attempts
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          console.log(`[WebSocket] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1)
            connect()
          }, reconnectDelay)
        }
      }
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      setConnectionStatus('error')
    }
  }, [
    connectionStatus,
    getWebSocketUrl,
    onOpen,
    onMessage,
    onError,
    onClose,
    autoReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
  ])

  // Connect on mount
  useEffect(() => {
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, []) // Only run once on mount

  // Manual reconnect function
  const reconnect = useCallback(() => {
    disconnect()
    setReconnectAttempts(0)
    setTimeout(() => connect(), 100)
  }, [disconnect, connect])

  return {
    socket,
    lastMessage,
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
  }
}
