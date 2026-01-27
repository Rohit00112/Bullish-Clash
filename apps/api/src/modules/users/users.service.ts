// ============================================================
// Bullish Clash - Users Service
// ============================================================

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, count, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class UsersService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
    ) { }

    async findById(id: string) {
        const user = await this.db.query.users.findFirst({
            where: eq(schema.users.id, id),
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.sanitizeUser(user);
    }

    async findByEmail(email: string) {
        const user = await this.db.query.users.findFirst({
            where: eq(schema.users.email, email.toLowerCase()),
        });

        return user ? this.sanitizeUser(user) : null;
    }

    async findAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const users = await this.db.query.users.findMany({
            limit,
            offset,
            orderBy: [desc(schema.users.createdAt)],
        });

        const [{ count: total }] = await this.db.select({ count: count() }).from(schema.users);

        return {
            data: users.map(this.sanitizeUser),
            total: Number(total),
            page,
            limit,
            totalPages: Math.ceil(Number(total) / limit),
        };
    }

    async updateProfile(userId: string, data: { fullName?: string; phone?: string; avatarUrl?: string }) {
        const [updated] = await this.db.update(schema.users)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, userId))
            .returning();

        if (!updated) {
            throw new NotFoundException('User not found');
        }

        return this.sanitizeUser(updated);
    }

    async deactivate(userId: string) {
        const [updated] = await this.db.update(schema.users)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, userId))
            .returning();

        if (!updated) {
            throw new NotFoundException('User not found');
        }

        return { success: true };
    }

    async deleteUser(userId: string) {
        // Check if user exists
        const user = await this.db.query.users.findFirst({
            where: eq(schema.users.id, userId),
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            throw new Error('Cannot delete admin users');
        }

        // Delete competition participants (no FK constraint on userId)
        await this.db.delete(schema.competitionParticipants)
            .where(eq(schema.competitionParticipants.userId, userId));

        // Delete user (cascades will handle other related records)
        await this.db.delete(schema.users)
            .where(eq(schema.users.id, userId));

        return { success: true, message: 'User deleted successfully' };
    }

    // ==================== WATCHLIST ====================

    async getWatchlist(userId: string): Promise<string[]> {
        const items = await this.db.select({
            symbolId: schema.watchlist.symbolId,
        })
            .from(schema.watchlist)
            .where(eq(schema.watchlist.userId, userId))
            .orderBy(desc(schema.watchlist.createdAt));

        return items.map((item: { symbolId: string }) => item.symbolId);
    }

    async addToWatchlist(userId: string, symbolId: string) {
        // Check if already in watchlist
        const existing = await this.db.select()
            .from(schema.watchlist)
            .where(
                and(
                    eq(schema.watchlist.userId, userId),
                    eq(schema.watchlist.symbolId, symbolId)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return { success: true, message: 'Already in watchlist' };
        }

        await this.db.insert(schema.watchlist).values({
            userId,
            symbolId,
        });

        return { success: true };
    }

    async removeFromWatchlist(userId: string, symbolId: string) {
        await this.db.delete(schema.watchlist)
            .where(
                and(
                    eq(schema.watchlist.userId, userId),
                    eq(schema.watchlist.symbolId, symbolId)
                )
            );

        return { success: true };
    }

    async updateWatchlist(userId: string, symbolIds: string[]) {
        // Clear existing watchlist
        await this.db.delete(schema.watchlist)
            .where(eq(schema.watchlist.userId, userId));

        // Add new items
        if (symbolIds.length > 0) {
            const items = symbolIds.map(symbolId => ({
                userId,
                symbolId,
            }));

            await this.db.insert(schema.watchlist).values(items);
        }

        return { success: true, symbolIds };
    }

    private sanitizeUser(user: any) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
}
