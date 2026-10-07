import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function restoreSeed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const sqlFile = path.resolve(process.cwd(), 'infra/seeds/test-database-seed.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ Fichier de seed introuvable : ${sqlFile}`);
    process.exit(1);
  }

  console.log(`🔌 Connexion à la base de données...`);
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    console.log(`📖 Lecture du fichier de seed SQL...`);
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    console.log(`🚀 Exécution des requêtes de restauration...`);
    await client.query(sql);

    console.log(`✅ Base de données initialisée et restaurée avec succès avec les données de test !`);
  } catch (error) {
    console.error(`❌ Erreur lors de la restauration du seed :`, error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

restoreSeed();
