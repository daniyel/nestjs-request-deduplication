import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  await app.listen(3001);
  console.log(`Server is running on http://localhost:${PORT}`);
}
bootstrap();
