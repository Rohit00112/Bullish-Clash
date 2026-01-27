'use client';

import { useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePriceStore } from '@/stores/price-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

interface PriceUpdate {
    symbolId: string;
    symbol: string;
    price: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    eventId?: string;
}

interface MarketEvent {
    eventId: string;
    title: string;
    description?: string;
    impactType: string;
    symbolsAffected: number;
}

type MessageHandler = (data: any) => void;

export function useWebSocket() {
    const updatePrice = usePriceStore((state) => state.updatePrice);
    const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

    const connect = useCallback(() => {
        if (socket?.connected) return;

        socket = io(`${WS_URL}/trading`, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('WebSocket connected');
            // Subscribe to price updates by default
            socket?.emit('subscribe_prices');
            socket?.emit('subscribe_leaderboard');
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        socket.on('connected', (data) => {
            console.log('Connected to server:', data);
        });

        // Price updates
        socket.on('price_update', (message) => {
            const { data } = message;
            updatePrice(data);
            notifyHandlers('price_update', data);
        });

        socket.on('price_batch_update', (message) => {
            const { data } = message;
            data.forEach((update: PriceUpdate) => {
                updatePrice(update);
            });
            notifyHandlers('price_batch_update', data);
        });

        // Trade executed
        socket.on('trade_executed', (message) => {
            notifyHandlers('trade_executed', message.data);
        });

        // Leaderboard updates
        socket.on('leaderboard_update', (message) => {
            notifyHandlers('leaderboard_update', message.data);
        });

        // Market events
        socket.on('market_event', (message) => {
            notifyHandlers('market_event', message.data);
        });

        // Competition status
        socket.on('competition_status', (message) => {
            notifyHandlers('competition_status', message.data);
        });

        // Achievement unlocked
        socket.on('achievement_unlocked', (message) => {
            notifyHandlers('achievement_unlocked', message.data);
        });

        // Error handling
        socket.on('error', (data) => {
            console.error('WebSocket error:', data);
            notifyHandlers('error', data);
        });
    }, [updatePrice]);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    }, []);

    const authenticate = useCallback((token: string) => {
        if (socket?.connected) {
            socket.emit('authenticate', { token });
        }
    }, []);

    const subscribe = useCallback((event: string, handler: MessageHandler) => {
        if (!handlersRef.current.has(event)) {
            handlersRef.current.set(event, new Set());
        }
        handlersRef.current.get(event)!.add(handler);

        // Return unsubscribe function
        return () => {
            handlersRef.current.get(event)?.delete(handler);
        };
    }, []);

    const notifyHandlers = (event: string, data: any) => {
        const handlers = handlersRef.current.get(event);
        if (handlers) {
            handlers.forEach((handler) => handler(data));
        }
    };

    // Ping to keep connection alive
    useEffect(() => {
        const interval = setInterval(() => {
            if (socket?.connected) {
                socket.emit('ping');
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        connect,
        disconnect,
        authenticate,
        subscribe,
        isConnected: () => socket?.connected ?? false,
    };
}
