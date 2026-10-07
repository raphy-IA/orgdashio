import { createPgPool, createDbClient } from '@orgdashio/shared';
import { AuthService } from '../apps/api/src/modules/auth/auth.service';

async function main() {
  const pool = createPgPool('postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio');
  const db = createDbClient(pool);
  const service = new AuthService(db);

  try {
    const res = await service.registerTenant({
      tenantName: 'InnovYeng Test Org',
      adminEmail: 'test-admin-' + Date.now() + '@innovyeng.com',
      password: 'SuperPassword123!',
    });
    console.log('🎉 SUCCESS: Tenant registered with RLS!', res.tenant.name, res.tenant.id);
  } catch (err: any) {
    console.error('❌ ERROR:', err.message);
  } finally {
    await pool.end();
  }
}

main();
