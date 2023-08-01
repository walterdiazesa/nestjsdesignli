import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Config axios to not throw (by default) on HTTP status outside 200-299
  axios.interceptors.response.use(
    (r) => r,
    (e) => e,
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
