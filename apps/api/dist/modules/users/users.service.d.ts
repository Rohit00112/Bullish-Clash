export declare class UsersService {
    private readonly db;
    constructor(db: any);
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateProfile(userId: string, data: {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<any>;
    deactivate(userId: string): Promise<{
        success: boolean;
    }>;
    deleteUser(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getWatchlist(userId: string): Promise<string[]>;
    addToWatchlist(userId: string, symbolId: string): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    removeFromWatchlist(userId: string, symbolId: string): Promise<{
        success: boolean;
    }>;
    updateWatchlist(userId: string, symbolIds: string[]): Promise<{
        success: boolean;
        symbolIds: string[];
    }>;
    private sanitizeUser;
}
