// ============================================================
// Bullish Clash - Shared Types & Constants
// Nepal Stock Market Trading Simulator
// ============================================================

// ==================== ENUMS ====================

export enum UserRole {
    ADMIN = 'admin',
    PARTICIPANT = 'participant',
}

export enum OrderSide {
    BUY = 'buy',
    SELL = 'sell',
}

export enum OrderType {
    MARKET = 'market',
    LIMIT = 'limit',
}

export enum OrderStatus {
    PENDING = 'pending',
    FILLED = 'filled',
    PARTIAL = 'partial',
    CANCELLED = 'cancelled',
    REJECTED = 'rejected',
}

export enum CompetitionStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    PAUSED = 'paused',
    ENDED = 'ended',
}

export enum EventImpactType {
    POSITIVE = 'positive',
    NEGATIVE = 'negative',
    NEUTRAL = 'neutral',
}

export enum PriceUpdateType {
    PERCENTAGE = 'percentage',
    ABSOLUTE = 'absolute',
    OVERRIDE = 'override',
}

export enum Sector {
    COMMERCIAL_BANK = 'Commercial Bank',
    DEVELOPMENT_BANK = 'Development Bank',
    FINANCE = 'Finance',
    MICROFINANCE = 'Microfinance',
    LIFE_INSURANCE = 'Life Insurance',
    NON_LIFE_INSURANCE = 'Non Life Insurance',
    HYDROPOWER = 'Hydropower',
    MANUFACTURING = 'Manufacturing',
    HOTEL = 'Hotel',
    TRADING = 'Trading',
    OTHERS = 'Others',
}

// ==================== USER TYPES ====================

export interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfile extends User {
    portfolio?: Portfolio;
    rank?: number;
}

// ==================== SYMBOL TYPES ====================

export interface Symbol {
    id: string;
    symbol: string;
    companyName: string;
    sector: Sector;
    listedShares?: number;
    logoUrl?: string;
    isActive: boolean;
    basePrice: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SymbolWithPrice extends Symbol {
    currentPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
}

// ==================== PRICE TYPES ====================

export interface PriceTick {
    id: string;
    symbolId: string;
    price: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: Date;
    triggeredByEventId?: string;
}

export interface PriceCandle {
    symbolId: string;
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface LatestPrice {
    symbolId: string;
    symbol: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    updatedAt: Date;
}

// ==================== ORDER & TRADE TYPES ====================

export interface Order {
    id: string;
    userId: string;
    symbolId: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    filledQuantity: number;
    avgFilledPrice?: number;
    status: OrderStatus;
    commission: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Trade {
    id: string;
    orderId: string;
    userId: string;
    symbolId: string;
    side: OrderSide;
    quantity: number;
    price: number;
    total: number;
    commission: number;
    executedAt: Date;
}

export interface OrderRequest {
    symbolId: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
}

export interface OrderResponse {
    order: Order;
    trade?: Trade;
    message: string;
}

// ==================== PORTFOLIO TYPES ====================

export interface Position {
    symbolId: string;
    symbol: string;
    companyName: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
}

export interface Portfolio {
    userId: string;
    cash: number;
    totalValue: number;
    positions: Position[];
    unrealizedPL: number;
    realizedPL: number;
    totalPL: number;
    totalPLPercent: number;
    updatedAt: Date;
}

// ==================== LEADERBOARD TYPES ====================

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    totalValue: number;
    cash: number;
    investedValue: number;
    unrealizedPL: number;
    realizedPL: number;
    totalPL: number;
    totalPLPercent: number;
    tradeCount: number;
    previousRank?: number;
    rankChange: number;
}

export interface Leaderboard {
    entries: LeaderboardEntry[];
    totalParticipants: number;
    updatedAt: Date;
    competitionId: string;
}

// ==================== COMPETITION TYPES ====================

export interface Competition {
    id: string;
    name: string;
    description?: string;
    status: CompetitionStatus;
    startingCash: number;
    commissionRate: number;
    maxPositionSize?: number;
    maxDailyTrades?: number;
    allowShortSelling: boolean;
    allowMargin: boolean;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CompetitionSettings {
    startingCash: number;
    commissionRate: number;
    maxPositionSize?: number;
    maxDailyTrades?: number;
    allowShortSelling: boolean;
    allowMargin: boolean;
}

// ==================== EVENT TYPES ====================

export interface MarketEvent {
    id: string;
    title: string;
    description?: string;
    impactType: EventImpactType;
    priceUpdateType: PriceUpdateType;
    magnitude: number;
    affectedSymbols: string[];
    affectAllSymbols: boolean;
    isExecuted: boolean;
    scheduledAt?: Date;
    executedAt?: Date;
    executedBy?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEventRequest {
    title: string;
    description?: string;
    impactType: EventImpactType;
    priceUpdateType: PriceUpdateType;
    magnitude: number;
    affectedSymbols?: string[];
    affectAllSymbols?: boolean;
    scheduledAt?: Date;
    executeNow?: boolean;
}

// ==================== WEBSOCKET TYPES ====================

export enum WebSocketEventType {
    // Price events
    PRICE_UPDATE = 'price_update',
    PRICE_BATCH_UPDATE = 'price_batch_update',

    // Trade events
    TRADE_EXECUTED = 'trade_executed',
    ORDER_UPDATE = 'order_update',

    // Leaderboard events
    LEADERBOARD_UPDATE = 'leaderboard_update',
    RANK_CHANGE = 'rank_change',

    // Competition events
    COMPETITION_STATUS = 'competition_status',
    COMPETITION_STARTED = 'competition_started',
    COMPETITION_PAUSED = 'competition_paused',
    COMPETITION_RESUMED = 'competition_resumed',
    COMPETITION_ENDED = 'competition_ended',

    // Market events
    MARKET_EVENT = 'market_event',

    // User events
    PORTFOLIO_UPDATE = 'portfolio_update',

    // System events
    CONNECTED = 'connected',
    ERROR = 'error',
    PING = 'ping',
    PONG = 'pong',
}

export interface WebSocketMessage<T = unknown> {
    event: WebSocketEventType;
    data: T;
    timestamp: Date;
}

export interface PriceUpdatePayload {
    symbolId: string;
    symbol: string;
    price: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    eventId?: string;
}

export interface LeaderboardUpdatePayload {
    entries: LeaderboardEntry[];
    totalParticipants: number;
}

export interface CompetitionStatusPayload {
    status: CompetitionStatus;
    message?: string;
    remainingTime?: number;
}

export interface TradeExecutedPayload {
    trade: Trade;
    portfolio: Portfolio;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== AUTH TYPES ====================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    username: string;
    fullName: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface TokenPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}

// ==================== CONSTANTS ====================

export const DEFAULTS = {
    STARTING_CASH: 1_000_000,
    COMMISSION_RATE: 0.004,
    MAX_POSITION_SIZE: undefined,
    MAX_DAILY_TRADES: undefined,
    ALLOW_SHORT_SELLING: false,
    ALLOW_MARGIN: false,
    TIMEZONE: 'Asia/Kathmandu',
    CURRENCY: 'NPR',
    CURRENCY_SYMBOL: 'रू',
} as const;

export const RATE_LIMITS = {
    ORDERS_PER_MINUTE: 30,
    API_REQUESTS_PER_MINUTE: 100,
    WEBSOCKET_MESSAGES_PER_SECOND: 10,
} as const;

export const VALIDATION = {
    MIN_ORDER_QUANTITY: 1,
    MAX_ORDER_QUANTITY: 1_000_000,
    MIN_PRICE: 0.01,
    MAX_PRICE: 100_000_000,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    PASSWORD_MIN_LENGTH: 8,
} as const;

// ==================== UTILITY TYPES ====================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
