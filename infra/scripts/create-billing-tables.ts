import 'dotenv/config';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log('--- Creating SaaS Billing & Subscription tables ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "subscription_plan" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" text NOT NULL UNIQUE,
        "name" text NOT NULL,
        "description" text,
        "price_monthly" numeric(19, 4) NOT NULL DEFAULT '0',
        "price_annual" numeric(19, 4) NOT NULL DEFAULT '0',
        "max_users" integer NOT NULL DEFAULT 5,
        "max_storage_gb" integer NOT NULL DEFAULT 5,
        "max_projects" integer NOT NULL DEFAULT 5,
        "features" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "tenant_subscription" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL UNIQUE REFERENCES "tenant_registry"("id") ON DELETE CASCADE,
        "plan_code" text NOT NULL DEFAULT 'starter',
        "billing_cycle" text NOT NULL DEFAULT 'monthly',
        "status" text NOT NULL DEFAULT 'active',
        "seat_count" integer NOT NULL DEFAULT 5,
        "current_period_start" timestamp with time zone NOT NULL DEFAULT now(),
        "current_period_end" timestamp with time zone,
        "trial_ends_at" timestamp with time zone,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "stripe_customer_id" text,
        "stripe_subscription_id" text,
        "payment_method_last4" text,
        "payment_method_brand" text,
        "billing_email" text,
        "billing_address" text,
        "neq_number" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "tenant_invoice" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenant_registry"("id") ON DELETE CASCADE,
        "invoice_number" text NOT NULL UNIQUE,
        "plan_name" text NOT NULL,
        "billing_cycle" text NOT NULL DEFAULT 'monthly',
        "subtotal" numeric(19, 4) NOT NULL,
        "tax_tps" numeric(19, 4) NOT NULL DEFAULT '0',
        "tax_tvq" numeric(19, 4) NOT NULL DEFAULT '0',
        "total" numeric(19, 4) NOT NULL,
        "currency" text NOT NULL DEFAULT 'CAD',
        "status" text NOT NULL DEFAULT 'paid',
        "paid_at" timestamp with time zone,
        "period_start" timestamp with time zone NOT NULL DEFAULT now(),
        "period_end" timestamp with time zone NOT NULL DEFAULT now(),
        "pdf_url" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // Seed default plans if not already seeded
    console.log('--- Seeding default SaaS Subscription Plans ---');
    await client.query(`
      INSERT INTO "subscription_plan" ("code", "name", "description", "price_monthly", "price_annual", "max_users", "max_storage_gb", "max_projects", "features", "is_active")
      VALUES 
        ('community', 'Communautaire / Émergent', 'Idéal pour les petits organismes et collectifs bénévoles', '0.00', '0.00', 3, 2, 2, '["cases_basic", "projects_basic", "reports_standard"]', true),
        ('starter', 'Starter OBNL', 'Pour les organismes en croissance avec suivi de cas et cadre de résultats', '49.00', '490.00', 10, 15, 10, '["cases", "indicators", "training", "custom_branding", "audit_logs", "reports_standard"]', true),
        ('pro', 'Pro Impact Multi-Projets', 'Pour les organismes structurés gérant de multiples bailleurs et équipes', '149.00', '1490.00', 35, 100, 50, '["cases_advanced", "indicators_advanced", "break_glass", "training", "donor_reports", "priority_support", "audit_logs", "custom_branding"]', true),
        ('enterprise', 'Fédération / Grande Organisation', 'Pour les grands réseaux avec besoins sur-mesure et conformité stricte', '399.00', '3990.00', 9999, 1000, 9999, '["all_features", "dedicated_support", "custom_integrations", "sla_99_9", "unlimited_seats"]', true)
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price_monthly" = EXCLUDED."price_monthly",
        "price_annual" = EXCLUDED."price_annual",
        "max_users" = EXCLUDED."max_users",
        "max_storage_gb" = EXCLUDED."max_storage_gb",
        "max_projects" = EXCLUDED."max_projects",
        "features" = EXCLUDED."features";
    `);

    // Ensure all existing tenants have an active starter subscription
    console.log('--- Ensuring existing tenants have subscriptions ---');
    await client.query(`
      INSERT INTO "tenant_subscription" ("tenant_id", "plan_code", "billing_cycle", "status", "seat_count", "current_period_start", "current_period_end", "payment_method_last4", "payment_method_brand")
      SELECT 
        t.id, 
        'starter', 
        'monthly', 
        'active', 
        10, 
        now(), 
        now() + interval '30 days',
        '4242',
        'Visa'
      FROM "tenant_registry" t
      ON CONFLICT ("tenant_id") DO NOTHING;
    `);

    console.log('✅ Billing & Subscription tables created and seeded successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
