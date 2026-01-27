"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolsModule = void 0;
const common_1 = require("@nestjs/common");
const symbols_controller_1 = require("./symbols.controller");
const symbols_service_1 = require("./symbols.service");
let SymbolsModule = class SymbolsModule {
};
exports.SymbolsModule = SymbolsModule;
exports.SymbolsModule = SymbolsModule = __decorate([
    (0, common_1.Module)({
        controllers: [symbols_controller_1.SymbolsController],
        providers: [symbols_service_1.SymbolsService],
        exports: [symbols_service_1.SymbolsService],
    })
], SymbolsModule);
//# sourceMappingURL=symbols.module.js.map