import { userAccount, userCredential } from '@orgdashio/shared';
import { createPgPool, createDbClient } from '../../apps/api/src/common/database/drizzle-client';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';

async function seedSuperAdmin() {
  const pool = createPgPool('postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio');
  const db = createDbClient(pool);

  const email = 'superadmin@orgdashio.com';
  const password = 'SuperAdmin2026!';
  const hashedPassword = await hash(password);

  console.log('🌱 Création du compte Super-Admin SaaS...');

  // Check if superadmin exists
  const [existing] = await db
    .select()
    .from(userAccount)
    .where(eq(userAccount.email, email));

  let userId: string;

  if (existing) {
    console.log('🔄 Compte Super-Admin existant détecté, mise à jour des privilèges...');
    await db
      .update(userAccount)
      .set({ isPlatformAdmin: true, status: 'active' })
      .where(eq(userAccount.id, existing.id));

    // Update credential
    await db
      .insert(userCredential)
      .values({
        userId: existing.id,
        type: 'password',
        secretHash: hashedPassword,
      })
      .onConflictDoUpdate({
        target: userCredential.userId,
        set: { secretHash: hashedPassword },
      });

    userId = existing.id;
  } else {
    // Insert new superadmin account
    const [user] = await db
      .insert(userAccount)
      .values({
        email,
        locale: 'fr-CA',
        isPlatformAdmin: true,
        status: 'active',
      })
      .returning();

    await db.insert(userCredential).values({
      userId: user.id,
      type: 'password',
      secretHash: hashedPassword,
    });

    userId = user.id;
  }

  console.log('🎉 Super-Admin créé avec succès !');
  console.log('-----------------------------------');
  console.log(`Courriel     : ${email}`);
  console.log(`Mot de passe : ${password}`);
  console.log(`Privilège    : Super-Admin SaaS (isPlatformAdmin: true)`);
  console.log('-----------------------------------');

  await pool.end();
}

seedSuperAdmin().catch((err) => {
  console.error('❌ Erreur lors du seed Super-Admin:', err);
  process.exit(1);
});
