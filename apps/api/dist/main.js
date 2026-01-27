"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bullish Clash API')
        .setDescription('Nepal Stock Market Trading Simulator API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('symbols', 'Stock symbols')
        .addTag('prices', 'Price data')
        .addTag('trading', 'Trading operations')
        .addTag('portfolio', 'Portfolio management')
        .addTag('leaderboard', 'Competition leaderboard')
        .addTag('events', 'Admin market events')
        .addTag('competition', 'Competition settings')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🐂 Bullish Clash API Server                             ║
  ║                                                           ║
  ║   🚀 Server running on: http://localhost:${port}            ║
  ║   📚 API Docs: http://localhost:${port}/api/docs            ║
  ║   🕐 Timezone: Asia/Kathmandu (Nepal)                     ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map