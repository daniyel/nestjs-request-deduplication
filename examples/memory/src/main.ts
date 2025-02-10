import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodFilter } from './filters/exception.filter';

const PORT = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new ZodFilter());

  await app.listen(3001);
  console.log(`Server is running on http://localhost:${PORT} 🚀`);
}
bootstrap();
