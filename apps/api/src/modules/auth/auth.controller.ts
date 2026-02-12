// ============================================================
// Bullish Battle - Auth Controller
// ============================================================

import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, RefreshTokenDto, ChangePasswordDto } from './auth.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from './auth.guards';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
        return this.authService.refreshToken(dto);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(userId, dto);
    }

    @Post('create-user')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 409, description: 'Email or username already exists' })
    async createUser(@Body() dto: RegisterDto) {
        return this.authService.createUserWithEmail(dto);
    }
}
