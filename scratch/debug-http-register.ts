import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';

async function debugHttp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  await app.listen(3001, '127.0.0.1');
  console.log('API listening on 3001 for debug test');

  try {
    const res = await fetch('http://127.0.0.1:3001/api/v1/auth/register-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantName: 'Debug Org ' + Date.now(),
        adminEmail: 'admin-' + Date.now() + '@debug.com',
        password: 'SuperPassword123!',
      }),
    });

    const status = res.status;
    const bodyText = await res.text();
    console.log(`HTTP Status: ${status}`);
    console.log(`HTTP Body: ${bodyText}`);
  } catch (err: any) {
    console.error('Fetch error:', err);
  } finally {
    await app.close();
  }
}

debugHttp();
