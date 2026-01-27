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
exports.SymbolsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const symbols_service_1 = require("./symbols.service");
const symbols_dto_1 = require("./symbols.dto");
const auth_guards_1 = require("../auth/auth.guards");
let SymbolsController = class SymbolsController {
    symbolsService;
    constructor(symbolsService) {
        this.symbolsService = symbolsService;
    }
    async findAll(sector, search, activeOnly) {
        return this.symbolsService.findAll({ sector, search, activeOnly });
    }
    async getSectors() {
        return this.symbolsService.getSectors();
    }
    async findOne(id) {
        return this.symbolsService.findById(id);
    }
    async create(dto) {
        return this.symbolsService.create(dto);
    }
    async update(id, dto) {
        return this.symbolsService.update(id, dto);
    }
    async delete(id) {
        return this.symbolsService.delete(id);
    }
};
exports.SymbolsController = SymbolsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all symbols (NEPSE listed companies)' }),
    (0, swagger_1.ApiQuery)({ name: 'sector', required: false, description: 'Filter by sector' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by symbol or company name' }),
    (0, swagger_1.ApiQuery)({ name: 'activeOnly', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of symbols' }),
    __param(0, (0, common_1.Query)('sector')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('sectors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available sectors' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of sectors' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "getSectors", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get symbol by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Symbol details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Symbol not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new symbol (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Symbol created' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Symbol already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [symbols_dto_1.CreateSymbolDto]),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a symbol (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Symbol updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Symbol not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, symbols_dto_1.UpdateSymbolDto]),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guards_1.JwtAuthGuard, auth_guards_1.RolesGuard),
    (0, auth_guards_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a symbol (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Symbol deactivated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Symbol not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SymbolsController.prototype, "delete", null);
exports.SymbolsController = SymbolsController = __decorate([
    (0, swagger_1.ApiTags)('symbols'),
    (0, common_1.Controller)('symbols'),
    __metadata("design:paramtypes", [symbols_service_1.SymbolsService])
], SymbolsController);
//# sourceMappingURL=symbols.controller.js.map