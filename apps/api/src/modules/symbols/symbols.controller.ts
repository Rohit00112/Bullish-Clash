// ============================================================
// Bullish Clash - Symbols Controller
// ============================================================

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SymbolsService } from './symbols.service';
import { CreateSymbolDto, UpdateSymbolDto } from './symbols.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guards';

@ApiTags('symbols')
@Controller('symbols')
export class SymbolsController {
    constructor(private readonly symbolsService: SymbolsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all symbols (NEPSE listed companies)' })
    @ApiQuery({ name: 'sector', required: false, description: 'Filter by sector' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by symbol or company name' })
    @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'List of symbols' })
    async findAll(
        @Query('sector') sector?: string,
        @Query('search') search?: string,
        @Query('activeOnly') activeOnly?: boolean,
    ) {
        return this.symbolsService.findAll({ sector, search, activeOnly });
    }

    @Get('sectors')
    @ApiOperation({ summary: 'Get all available sectors' })
    @ApiResponse({ status: 200, description: 'List of sectors' })
    async getSectors() {
        return this.symbolsService.getSectors();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get symbol by ID' })
    @ApiResponse({ status: 200, description: 'Symbol details' })
    @ApiResponse({ status: 404, description: 'Symbol not found' })
    async findOne(@Param('id') id: string) {
        return this.symbolsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new symbol (admin only)' })
    @ApiResponse({ status: 201, description: 'Symbol created' })
    @ApiResponse({ status: 409, description: 'Symbol already exists' })
    async create(@Body() dto: CreateSymbolDto) {
        return this.symbolsService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a symbol (admin only)' })
    @ApiResponse({ status: 200, description: 'Symbol updated' })
    @ApiResponse({ status: 404, description: 'Symbol not found' })
    async update(@Param('id') id: string, @Body() dto: UpdateSymbolDto) {
        return this.symbolsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate a symbol (admin only)' })
    @ApiResponse({ status: 200, description: 'Symbol deactivated' })
    @ApiResponse({ status: 404, description: 'Symbol not found' })
    async delete(@Param('id') id: string) {
        return this.symbolsService.delete(id);
    }
}
