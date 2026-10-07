import * as fs from 'fs';
import * as path from 'path';

function fixEncoding() {
  const sqlFile = path.resolve(process.cwd(), 'infra/seeds/test-database-seed.sql');
  const jsonFile = path.resolve(process.cwd(), 'infra/seeds/test-database-seed.json');

  let sqlContent = fs.readFileSync(sqlFile, 'utf-8');
  let jsonContent = fs.readFileSync(jsonFile, 'utf-8');

  // Mapping of common mojibake / corrupted sequences
  const replacements: [RegExp, string][] = [
    [/Num├®rique/g, 'Numérique'],
    [/num├®rique/g, 'numérique'],
    [/A├«n├®s/g, 'Aînés'],
    [/a├«n├®s/g, 'aînés'],
    [/G├®n├®rale/g, 'Générale'],
    [/g├®n├®rale/g, 'générale'],
    [/Comptabilit├®/g, 'Comptabilité'],
    [/comptabilit├®/g, 'comptabilité'],
    [/B├®n├®volat/g, 'Bénévolat'],
    [/b├®n├®volat/g, 'bénévolat'],
    [/P├®nurie/g, 'Pénurie'],
    [/p├®nurie/g, 'pénurie'],
    [/Probabilit├®/g, 'Probabilité'],
    [/probabilit├®/g, 'probabilité'],
    [/S├®v├®rit├®/g, 'Sévérité'],
    [/s├®v├®rit├®/g, 'sévérité'],
    [/├ëlev├®e/g, 'Élevée'],
    [/├®lev├®e/g, 'élevée'],
    [/Hypoth├¿se/g, 'Hypothèse'],
    [/hypoth├¿se/g, 'hypothèse'],
    [/biblioth├¿ques/g, 'bibliothèques'],
    [/Enjeu r├®el/g, 'Enjeu réel'],
    [/trouv├®s/g, 'trouvés'],
    [/R├®duire/g, 'Réduire'],
    [/r├®duire/g, 'duire'],
    [/form├®s/g, 'formés'],
    [/fa├ºon/g, 'façon'],
    [/cr├®├®es/g, 'créées'],
    [/cr├®├®e/g, 'créée'],
    [/cr├®├®/g, 'créé'],
    [/distribu├®es/g, 'distribuées'],
    [/distribu├®/g, 'distribué'],
    [/reconditionn├®es/g, 'reconditionnées'],
    [/reconditionn├®/g, 'reconditionné'],
    [/Mat├®riel/g, 'Matériel'],
    [/mat├®riel/g, 'matériel'],
    [/pr├¬t/g, 'prêt'],
    [/Pr├®paratoire/g, 'Préparatoire'],
    [/pr├®paratoire/g, 'préparatoire'],
    [/D├®ploiement/g, 'Déploiement'],
    [/d├®ploiement/g, 'déploiement'],
    [/simplifi├®s/g, 'simplifiés'],
    [/simplifi├®/g, 'simplifié'],
    [/Minist├¿re/g, 'Ministère'],
    [/minist├¿re/g, 'ministère'],
    [/Organisme ├á but non lucratif/g, 'Organisme à but non lucratif'],
    [/├á surveiller/g, 'à surveiller'],
    [/├á/g, 'à'],
    [/├®/g, 'é'],
    [/├¿/g, 'è'],
    [/├¬/g, 'ê'],
    [/├«/g, 'î'],
    [/├º/g, 'ç'],
    [/ÔÇó/g, '•'],
    [/┬½/g, '«'],
    [/┬╗/g, '»'],
    [/Ô×ö/g, '->'],
  ];

  for (const [pattern, replacement] of replacements) {
    sqlContent = sqlContent.replace(pattern, replacement);
    jsonContent = jsonContent.replace(pattern, replacement);
  }

  fs.writeFileSync(sqlFile, sqlContent, { encoding: 'utf-8' });
  fs.writeFileSync(jsonFile, jsonContent, { encoding: 'utf-8' });

  console.log('✅ Caractères accentués et UTF-8 réparés avec succès dans le fichier de seed SQL et JSON !');
}

fixEncoding();
