import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface WebSocketHook {
    sendMessage: (message: any) => void;
    lastMessage: any | null;
    readyState: number;
}

export const useWebSocket = (url: string): WebSocketHook => {
    const { user } = useAuth();
    const [lastMessage, setLastMessage] = useState<any | null>(null);
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<any>(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Use environment variable if available, otherwise fallback to a robust calculation
        const wsBaseUrl = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + (['localhost', '127.0.0.1'].includes(window.location.hostname) ? '127.0.0.1:8000' : window.location.host);

        // Ensure no trailing slash in base URL and handle the url parameter
        const cleanBaseUrl = wsBaseUrl.endsWith('/') ? wsBaseUrl.slice(0, -1) : wsBaseUrl;
        const cleanUrl = url.startsWith('/') ? url : '/' + url;

        const fullUrl = `${cleanBaseUrl}${cleanUrl}?token=${token}`;

        ws.current = new WebSocket(fullUrl);

        ws.current.onopen = () => {
            setReadyState(WebSocket.OPEN);
        };

        ws.current.onclose = () => {
            setReadyState(WebSocket.CLOSED);
            // Reconnect after 3 seconds if token still exists
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                reconnectTimeout.current = setTimeout(connect, 3000);
            }
        };

        ws.current.onmessage = (event) => {
            try {
                const data = jsonParse(event.data);
                setLastMessage(data);
            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error", error);
            setReadyState(WebSocket.CLOSED);
        };
    }, [url, user]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            connect();
        }
        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.error("WebSocket is not open");
        }
    }, []);

    return { sendMessage, lastMessage, readyState };
};

function jsonParse(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}
