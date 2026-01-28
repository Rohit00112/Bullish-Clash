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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const database_module_1 = require("../../database/database.module");
const schema = require("../../database/schema");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    db;
    jwtService;
    configService;
    emailService;
    constructor(db, jwtService, configService, emailService) {
        this.db = db;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async register(dto) {
        const existingEmail = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.email, dto.email.toLowerCase()),
        });
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const existingUsername = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.username, dto.username.toLowerCase()),
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Username already taken');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const userId = (0, uuid_1.v4)();
        const [user] = await this.db.insert(schema.users).values({
            id: userId,
            email: dto.email.toLowerCase(),
            username: dto.username.toLowerCase(),
            fullName: dto.fullName,
            passwordHash,
            phone: dto.phone,
            role: 'participant',
            isActive: true,
        }).returning();
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.isDefault, true),
        });
        if (competition) {
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });
            await this.db.insert(schema.ledgerEntries).values({
                userId: user.id,
                competitionId: competition.id,
                type: 'initial',
                amount: competition.startingCash,
                balanceAfter: competition.startingCash,
                description: 'Initial competition balance',
            });
        }
        const tokens = await this.generateTokens(user);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async createUser(dto) {
        const existingEmail = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.email, dto.email.toLowerCase()),
        });
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const existingUsername = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.username, dto.username.toLowerCase()),
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Username already taken');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const userId = (0, uuid_1.v4)();
        const [user] = await this.db.insert(schema.users).values({
            id: userId,
            email: dto.email.toLowerCase(),
            username: dto.username.toLowerCase(),
            fullName: dto.fullName,
            passwordHash,
            phone: dto.phone,
            role: 'participant',
            isActive: true,
        }).returning();
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.isDefault, true),
        });
        if (competition) {
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });
            await this.db.insert(schema.ledgerEntries).values({
                userId: user.id,
                competitionId: competition.id,
                type: 'initial',
                amount: competition.startingCash,
                balanceAfter: competition.startingCash,
                description: 'Initial competition balance',
            });
        }
        return {
            success: true,
            user: this.sanitizeUser(user),
            message: `User ${user.email} created successfully. Password: ${dto.password}`,
            emailSent: false,
        };
    }
    async createUserWithEmail(dto) {
        const existingEmail = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.email, dto.email.toLowerCase()),
        });
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const existingUsername = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.username, dto.username.toLowerCase()),
        });
        if (existingUsername) {
            throw new common_1.ConflictException('Username already taken');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const userId = (0, uuid_1.v4)();
        const [user] = await this.db.insert(schema.users).values({
            id: userId,
            email: dto.email.toLowerCase(),
            username: dto.username.toLowerCase(),
            fullName: dto.fullName,
            passwordHash,
            phone: dto.phone,
            role: 'participant',
            isActive: true,
            mustChangePassword: true,
        }).returning();
        const competition = await this.db.query.competitions.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.competitions.isDefault, true),
        });
        if (competition) {
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });
            await this.db.insert(schema.ledgerEntries).values({
                userId: user.id,
                competitionId: competition.id,
                type: 'initial',
                amount: competition.startingCash,
                balanceAfter: competition.startingCash,
                description: 'Initial competition balance',
            });
        }
        const emailSent = await this.emailService.sendWelcomeEmail({
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            password: dto.password,
        });
        return {
            success: true,
            user: this.sanitizeUser(user),
            emailSent,
            message: emailSent
                ? `User created and credentials sent to ${user.email}`
                : `User created but email failed to send. Password: ${dto.password}`,
        };
    }
    async login(dto) {
        const user = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema.users.email, dto.email.toLowerCase()),
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        await this.db.update(schema.users)
            .set({ lastLoginAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema.users.id, user.id));
        const tokens = await this.generateTokens(user);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async changePassword(userId, dto) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.db.update(schema.users)
            .set({
            passwordHash,
            mustChangePassword: false,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema.users.id, userId));
        return { success: true, message: 'Password changed successfully' };
    }
    async refreshToken(dto) {
        try {
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
            });
            const user = await this.db.query.users.findFirst({
                where: (0, drizzle_orm_1.eq)(schema.users.id, payload.sub),
            });
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const tokens = await this.generateTokens(user);
            return {
                user: this.sanitizeUser(user),
                ...tokens,
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') || 'refresh-secret',
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_module_1.DATABASE_CONNECTION)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map