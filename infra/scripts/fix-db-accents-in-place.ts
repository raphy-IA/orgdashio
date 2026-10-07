import pg from 'pg';

async function fixAccentsInPlace() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://postgres:Information%402025@127.0.0.1:5432/orgdashio';

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('🔧 Correction ciblée des caractères accentués (sans toucher aux données existantes)...');

  const replacements: [string, string][] = [
    ['Num├®rique', 'Numérique'],
    ['num├®rique', 'numérique'],
    ['A├«n├®s', 'Aînés'],
    ['a├«n├®s', 'aînés'],
    ['G├®n├®rale', 'Générale'],
    ['g├®n├®rale', 'générale'],
    ['Comptabilit├®', 'Comptabilité'],
    ['comptabilit├®', 'comptabilité'],
    ['B├®n├®volat', 'Bénévolat'],
    ['b├®n├®volat', 'bénévolat'],
    ['P├®nurie', 'Pénurie'],
    ['p├®nurie', 'pénurie'],
    ['Probabilit├®', 'Probabilité'],
    ['probabilit├®', 'probabilité'],
    ['S├®v├®rit├®', 'Sévérité'],
    ['s├®v├®rit├®', 'sévérité'],
    ['├ëlev├®e', 'Élevée'],
    ['├®lev├®e', 'élevée'],
    ['Hypoth├¿se', 'Hypothèse'],
    ['hypoth├¿se', 'hypothèse'],
    ['biblioth├¿ques', 'bibliothèques'],
    ['Enjeu r├®el', 'Enjeu réel'],
    ['trouv├®s', 'trouvés'],
    ['R├®duire', 'Réduire'],
    ['r├®duire', 'réduire'],
    ['form├®s', 'formés'],
    ['fa├ºon', 'façon'],
    ['cr├®├®es', 'créées'],
    ['cr├®├®e', 'créée'],
    ['cr├®├®', 'créé'],
    ['distribu├®es', 'distribuées'],
    ['distribu├®', 'distribué'],
    ['reconditionn├®es', 'reconditionnées'],
    ['reconditionn├®', 'reconditionné'],
    ['Mat├®riel', 'Matériel'],
    ['mat├®riel', 'matériel'],
    ['pr├¬t', 'prêt'],
    ['Pr├®paratoire', 'Préparatoire'],
    ['pr├®paratoire', 'préparatoire'],
    ['D├®ploiement', 'Déploiement'],
    ['d├®ploiement', 'déploiement'],
    ['simplifi├®s', 'simplifiés'],
    ['simplifi├®', 'simplifié'],
    ['Minist├¿re', 'Ministère'],
    ['minist├¿re', 'ministère'],
    ['Organisme ├á but non lucratif', 'Organisme à but non lucratif'],
    ['├á', 'à'],
    ['├®', 'é'],
    ['├¿', 'è'],
    ['├¬', 'ê'],
    ['├«', 'î'],
    ['├º', 'ç'],
    ['ÔÇó', '•'],
    ['┬½', '«'],
    ['┬╗', '»'],
    ['Ô×ö', '->'],
  ];

  // List of tables and text columns to fix
  const targets = [
    { table: 'tenant_registry', columns: ['name', 'description', 'org_type', 'address'] },
    { table: 'project', columns: ['name'] },
    { table: 'program', columns: ['name', 'description'] },
    { table: 'result_node', columns: ['title', 'description'] },
    { table: 'plan_item', columns: ['title'] },
    { table: 'plan_item_update', columns: ['comment', 'blocker_reason'] },
    { table: 'raid_item', columns: ['title', 'description', 'owner_name'] },
    { table: 'budget_line', columns: ['description'] },
    { table: 'funding_source', columns: ['donor_name', 'notes'] },
    { table: 'org_unit', columns: ['name'] },
    { table: 'party', columns: ['first_name', 'last_name'] },
    { table: 'staff_profile', columns: ['job_title', 'notes'] },
    { table: 'training_program', columns: ['title', 'objectives', 'target_audience'] },
    { table: 'course', columns: ['title', 'description', 'objectives'] },
    { table: 'training_session', columns: ['title'] },
    { table: 'role', columns: ['name'] },
  ];

  try {
    for (const target of targets) {
      for (const col of target.columns) {
        for (const [corrupted, clean] of replacements) {
          const query = `
            UPDATE "${target.table}"
            SET "${col}" = REPLACE("${col}", $1, $2)
            WHERE "${col}" LIKE '%' || $1 || '%';
          `;
          await client.query(query, [corrupted, clean]);
        }
      }
    }
    console.log('✅ Tous les accents ont été corrigés en base SANS supprimer aucune de vos modifications !');
  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error);
  } finally {
    await client.end();
  }
}

fixAccentsInPlace();
