import { Pool } from 'pg';

const p = new Pool({
  connectionString: 'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio',
});

async function run() {
  await p.query(`
    CREATE TABLE IF NOT EXISTS intervention_plan (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      case_file_id UUID NOT NULL REFERENCES case_file(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      start_date DATE,
      review_date DATE,
      created_by_user_id UUID NOT NULL REFERENCES user_account(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT intervention_plan_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS intervention_goal (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      plan_id UUID NOT NULL REFERENCES intervention_plan(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      target_date DATE,
      status TEXT NOT NULL DEFAULT 'in_progress',
      achieved_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT intervention_goal_tenant_id_id_unique UNIQUE (tenant_id, id)
    );

    CREATE TABLE IF NOT EXISTS case_referral (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      case_file_id UUID NOT NULL REFERENCES case_file(id) ON DELETE CASCADE,
      organization_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      referred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      outcome_notes TEXT,
      CONSTRAINT case_referral_tenant_id_id_unique UNIQUE (tenant_id, id)
    );
  `);
  console.log('Tables for CAS module created successfully');
  await p.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
