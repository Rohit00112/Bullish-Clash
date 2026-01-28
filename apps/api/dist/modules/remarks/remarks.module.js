"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemarksModule = void 0;
const common_1 = require("@nestjs/common");
const remarks_service_1 = require("./remarks.service");
const remarks_controller_1 = require("./remarks.controller");
const database_module_1 = require("../../database/database.module");
const competition_module_1 = require("../competition/competition.module");
let RemarksModule = class RemarksModule {
};
exports.RemarksModule = RemarksModule;
exports.RemarksModule = RemarksModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, competition_module_1.CompetitionModule],
        controllers: [remarks_controller_1.RemarksController],
        providers: [remarks_service_1.RemarksService],
        exports: [remarks_service_1.RemarksService],
    })
], RemarksModule);
//# sourceMappingURL=remarks.module.js.map