"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
let UsersService = class UsersService {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const user = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.id, id),
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.sanitizeUser(user);
    }
    async findByEmail(email) {
        const user = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.email, email.toLowerCase()),
        });
        return user ? this.sanitizeUser(user) : null;
    }
    async findAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const users = await this.db.query.users.findMany({
            limit,
            offset,
            orderBy: [(0, drizzle_orm_1.desc)(schema.users.createdAt)],
        });
        const [{ count: total }] = await this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema.users);
        return {
            data: users.map(this.sanitizeUser),
            total: Number(total),
            page,
            limit,
            totalPages: Math.ceil(Number(total) / limit),
        };
    }
    async updateProfile(userId, data) {
        const [updated] = await this.db.update(schema.users)
            .set({
            ...data,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.sanitizeUser(updated);
    }
    async deactivate(userId) {
        const [updated] = await this.db.update(schema.users)
            .set({
            isActive: false,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId))
            .returning();
        if (!updated) {
            throw new common_1.NotFoundException('User not found');
        }
        return { success: true };
    }
    async deleteUser(userId) {
        const user = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.id, userId),
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role === 'admin') {
            throw new Error('Cannot delete admin users');
        }
        await this.db.delete(schema.competitionParticipants)
            .where((0, drizzle_orm_1.eq)(schema.competitionParticipants.userId, userId));
        await this.db.delete(schema.users)
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId));
        return { success: true, message: 'User deleted successfully' };
    }
    async getWatchlist(userId) {
        const items = await this.db.select({
            symbolId: schema.watchlist.symbolId,
        })
            .from(schema.watchlist)
            .where((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema.watchlist.createdAt));
        return items.map((item) => item.symbolId);
    }
    async addToWatchlist(userId, symbolId) {
        const existing = await this.db.select()
            .from(schema.watchlist)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlist.symbolId, symbolId)))
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
    async removeFromWatchlist(userId, symbolId) {
        await this.db.delete(schema.watchlist)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId), (0, drizzle_orm_1.eq)(schema.watchlist.symbolId, symbolId)));
        return { success: true };
    }
    async updateWatchlist(userId, symbolIds) {
        await this.db.delete(schema.watchlist)
            .where((0, drizzle_orm_1.eq)(schema.watchlist.userId, userId));
        if (symbolIds.length > 0) {
            const items = symbolIds.map(symbolId => ({
                userId,
                symbolId,
            }));
            await this.db.insert(schema.watchlist).values(items);
        }
        return { success: true, symbolIds };
    }
    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object])
], UsersService);
//# sourceMappingURL=users.service.js.map