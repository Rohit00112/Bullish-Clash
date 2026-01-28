export declare class RegisterDto {
    email: string;
    username: string;
    fullName: string;
    password: string;
    phone?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ChangePasswordDto {
    password: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    phone?: string;
    isActive: boolean;
    createdAt: Date;
}
export declare class AuthResponseDto {
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
}
