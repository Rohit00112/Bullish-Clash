import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshTokenDto } from './auth.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    constructor(db: any, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    createUser(dto: RegisterDto): Promise<{
        success: boolean;
        user: any;
        message: string;
        emailSent: boolean;
    }>;
    createUserWithEmail(dto: RegisterDto): Promise<{
        success: boolean;
        user: any;
        emailSent: boolean;
        message: string;
    }>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto>;
    private generateTokens;
    private sanitizeUser;
}
