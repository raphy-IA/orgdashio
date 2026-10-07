import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: 'postgres://postgres:Information%402025@127.0.0.1:5432/postgres',
  });

  try {
    await client.connect();
    console.log('Connexion réussie à PostgreSQL.');
    await client.query('CREATE DATABASE orgdashio');
    console.log('🎉 Base de données orgdashio créée avec succès !');
  } catch (err: any) {
    if (err.code === '42P04') {
      console.log('La base orgdashio existe déjà.');
    } else {
      console.error('Erreur:', err.message);
    }
  } finally {
    await client.end();
  }
}

main();
