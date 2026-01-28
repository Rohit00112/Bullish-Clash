// ============================================================
// Bullish Clash - Auth Service
// ============================================================

import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { DATABASE_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshTokenDto } from './auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly db: any,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Check if email exists
        const existingEmail = await this.db.query.users.findFirst({
            where: eq(schema.users.email, dto.email.toLowerCase()),
        });

        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        // Check if username exists
        const existingUsername = await this.db.query.users.findFirst({
            where: eq(schema.users.username, dto.username.toLowerCase()),
        });

        if (existingUsername) {
            throw new ConflictException('Username already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create user
        const userId = uuid();
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

        // Get default competition
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.isDefault, true),
        });

        if (competition) {
            // Add to competition
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });

            // Initialize portfolio
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });

            // Create initial ledger entry
            await this.db.insert(schema.ledgerEntries).values({
                userId: user.id,
                competitionId: competition.id,
                type: 'initial',
                amount: competition.startingCash,
                balanceAfter: competition.startingCash,
                description: 'Initial competition balance',
            });
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    // Admin-only: Create user without returning tokens (user will login separately)
    async createUser(dto: RegisterDto) {
        // Check if email exists
        const existingEmail = await this.db.query.users.findFirst({
            where: eq(schema.users.email, dto.email.toLowerCase()),
        });

        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        // Check if username exists
        const existingUsername = await this.db.query.users.findFirst({
            where: eq(schema.users.username, dto.username.toLowerCase()),
        });

        if (existingUsername) {
            throw new ConflictException('Username already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create user
        const userId = uuid();
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

        // Get default competition
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.isDefault, true),
        });

        if (competition) {
            // Add to competition
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });

            // Initialize portfolio
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });

            // Create initial ledger entry
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

    // Admin-only: Create user and send welcome email
    async createUserWithEmail(dto: RegisterDto) {
        // Check if email exists
        const existingEmail = await this.db.query.users.findFirst({
            where: eq(schema.users.email, dto.email.toLowerCase()),
        });

        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        // Check if username exists
        const existingUsername = await this.db.query.users.findFirst({
            where: eq(schema.users.username, dto.username.toLowerCase()),
        });

        if (existingUsername) {
            throw new ConflictException('Username already taken');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Create user
        const userId = uuid();
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

        // Get default competition
        const competition = await this.db.query.competitions.findFirst({
            where: eq(schema.competitions.isDefault, true),
        });

        if (competition) {
            // Add to competition
            await this.db.insert(schema.competitionParticipants).values({
                competitionId: competition.id,
                userId: user.id,
                isActive: true,
            });

            // Initialize portfolio
            await this.db.insert(schema.portfolios).values({
                userId: user.id,
                competitionId: competition.id,
                cash: competition.startingCash,
                realizedPL: '0',
                tradeCount: 0,
            });

            // Create initial ledger entry
            await this.db.insert(schema.ledgerEntries).values({
                userId: user.id,
                competitionId: competition.id,
                type: 'initial',
                amount: competition.startingCash,
                balanceAfter: competition.startingCash,
                description: 'Initial competition balance',
            });
        }

        // Send welcome email with credentials
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

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Find user by email
        const user = await this.db.query.users.findFirst({
            where: eq(schema.users.email, dto.email.toLowerCase()),
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Update last login
        await this.db.update(schema.users)
            .set({ lastLoginAt: new Date() })
            .where(eq(schema.users.id, user.id));

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async changePassword(userId: string, dto: { password: string }) {
        const passwordHash = await bcrypt.hash(dto.password, 10);

        await this.db.update(schema.users)
            .set({
                passwordHash,
                mustChangePassword: false,
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, userId));

        return { success: true, message: 'Password changed successfully' };
    }

    async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
        try {
            // Verify refresh token
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
            });

            // Find user
            const user = await this.db.query.users.findFirst({
                where: eq(schema.users.id, payload.sub),
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('Invalid token');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user);

            return {
                user: this.sanitizeUser(user),
                ...tokens,
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateTokens(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
            expiresIn: '7d',
        });

        return { accessToken, refreshToken };
    }

    private sanitizeUser(user: any) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
}
