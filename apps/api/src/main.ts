// ============================================================
// Bullish Battle - NestJS Application Entry Point
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Global request logger
    app.use((req: any, res: any, next: () => void) => {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
        next();
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Bullish Battle API')
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');

    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🐂 Bullish Battle API Server                             ║
  ║                                                           ║
  ║   🚀 Server running on: http://localhost:${port}            ║
  ║   📚 API Docs: http://localhost:${port}/api/docs            ║
  ║   🕐 Timezone: Asia/Kathmandu (Nepal)                     ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
