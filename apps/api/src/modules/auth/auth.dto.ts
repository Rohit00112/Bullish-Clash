// ============================================================
// Bullish Clash - Auth DTOs
// ============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'trader@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'trader123' })
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    })
    username: string;

    @ApiProperty({ example: 'Ram Sharma' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    fullName: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;

    @ApiProperty({ example: '+977-9841234567', required: false })
    @IsOptional()
    @IsString()
    phone?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'trader@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    refreshToken: string;
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'NewSecurePass123!' })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty()
    role: string;

    @ApiProperty({ required: false })
    avatarUrl?: string;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    createdAt: Date;
}

export class AuthResponseDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;

    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}
