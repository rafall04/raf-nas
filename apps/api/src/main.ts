import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// BigInt -> number saat serialisasi JSON (ukuran file muat aman di Number).
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (this: bigint): number {
  return Number(this);
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Bind ke localhost — hanya reverse proxy yang menghadap LAN di 443/80.
  const host = process.env.API_HOST ?? '127.0.0.1';
  const port = Number(process.env.API_PORT ?? 4000);

  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`RAF NAS API listening on http://${host}:${port}/api`);
}

void bootstrap();
