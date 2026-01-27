import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshTokenDto } from './auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto>;
    createUser(dto: RegisterDto): Promise<{
        success: boolean;
        user: any;
        emailSent: boolean;
        message: string;
    }>;
}
