import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(userId: string): Promise<any>;
    updateMe(userId: string, body: {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<any>;
    getWatchlist(userId: string): Promise<{
        symbolIds: string[];
    }>;
    addToWatchlist(userId: string, body: {
        symbolId: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    updateWatchlist(userId: string, body: {
        symbolIds: string[];
    }): Promise<{
        success: boolean;
        symbolIds: string[];
    }>;
    removeFromWatchlist(userId: string, symbolId: string): Promise<{
        success: boolean;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
