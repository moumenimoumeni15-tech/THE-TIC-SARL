#!/usr/bin/env node
/**
 * Script de diagnostic de la base de données exécuté automatiquement lors du build Vercel.
 * Affiche des messages clairs et détaillés dans les journaux de déploiement Vercel.
 */

import https from 'https';
import http from 'http';

// Identifiants configurés dans l'environnement ou valeurs par défaut
const ENV_URL = process.env.VITE_SUPABASE_URL || '';
const ENV_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const DEFAULT_URL = 'https://xcghmecugjdyorsibtno.supabase.co';
const DEFAULT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2htZWN1Z2pkeW9yc2lidG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3OTU2NzksImV4cCI6MjEwNzM3MTY3OX0.U2pK6ono0ne6TcKkd5BwKmGoJTpQpXzuX12cu_N_O2c';

function sanitizeUrl(raw) {
  if (!raw) return '';
  let url = raw.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  return url;
}

const targetUrl = sanitizeUrl(ENV_URL) || DEFAULT_URL;
const targetKey = (ENV_KEY && !ENV_KEY.includes('your-anon-key')) ? ENV_KEY.trim() : DEFAULT_KEY;

console.log('\n======================================================================');
console.log('🔍 [VERCEL DÉPLOIEMENT] DIAGNOSTIC DE CONNEXION BASE DE DONNÉES CLOUD');
console.log('======================================================================');
console.log(`📌 URL du serveur cible : ${targetUrl}`);
console.log(`🔑 Clé d'API configurée : ${targetKey ? 'Oui (' + targetKey.substring(0, 15) + '...)' : 'Non'}`);
console.log(`⚙️ Origine de l'URL     : ${ENV_URL ? 'Variable Vercel VITE_SUPABASE_URL' : 'Valeur de secours par défaut'}`);
console.log('----------------------------------------------------------------------');

function makeRequest(path) {
  return new Promise((resolve) => {
    try {
      const fullUrl = new URL(path, targetUrl);
      const isHttps = fullUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        fullUrl,
        {
          method: 'GET',
          headers: {
            apikey: targetKey,
            Authorization: `Bearer ${targetKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 0,
              body,
            });
          });
        }
      );

      req.on('error', (err) => {
        resolve({
          statusCode: 0,
          error: err.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 0,
          error: 'Délai d\'attente dépassé (timeout 6s)',
        });
      });

      req.end();
    } catch (e) {
      resolve({
        statusCode: 0,
        error: e.message,
      });
    }
  });
}

async function runCheck() {
  // 1. Tester la table 'rapports'
  const rapportsTest = await makeRequest('/rest/v1/rapports?select=id&limit=1');

  // 2. Tester la table 'taches'
  const tachesTest = await makeRequest('/rest/v1/taches?select=id&limit=1');

  let hasErrors = false;

  console.log('\n📊 RÉSULTAT DU TEST DES TABLES :');

  // Analyse 'rapports'
  if (rapportsTest.statusCode === 200) {
    console.log('  ✅ Table "public.rapports" : ACCESSIBLE et PRÊTE (HTTP 200)');
  } else if (rapportsTest.statusCode === 404 || rapportsTest.body?.includes('does not exist') || rapportsTest.body?.includes('42P01') || rapportsTest.body?.includes('Could not find the table')) {
    hasErrors = true;
    console.log('  ❌ Table "public.rapports" : NON TROUVÉE (HTTP ' + rapportsTest.statusCode + ')');
    console.log('     -> Message : La table n\'existe pas encore dans le schéma public.');
  } else if (rapportsTest.statusCode === 401 || rapportsTest.statusCode === 403) {
    hasErrors = true;
    console.log('  ❌ Authentification refusée (HTTP ' + rapportsTest.statusCode + ')');
    console.log('     -> Message : Clé API anon invalide ou non autorisée.');
  } else if (rapportsTest.error) {
    hasErrors = true;
    console.log('  ❌ Échec de connexion réseau : ' + rapportsTest.error);
  } else {
    hasErrors = true;
    console.log('  ⚠️ Réponse inattendue (HTTP ' + rapportsTest.statusCode + ') : ' + rapportsTest.body);
  }

  // Analyse 'taches'
  if (tachesTest.statusCode === 200) {
    console.log('  ✅ Table "public.taches"   : ACCESSIBLE et PRÊTE (HTTP 200)');
  } else if (tachesTest.statusCode === 404 || tachesTest.body?.includes('does not exist') || tachesTest.body?.includes('42P01') || tachesTest.body?.includes('Could not find the table')) {
    hasErrors = true;
    console.log('  ❌ Table "public.taches"   : NON TROUVÉE (HTTP ' + tachesTest.statusCode + ')');
    console.log('     -> Message : La table n\'existe pas encore dans le schéma public.');
  } else if (tachesTest.statusCode !== 200) {
    hasErrors = true;
    console.log('  ⚠️ Statut table taches : HTTP ' + tachesTest.statusCode);
  }

  console.log('----------------------------------------------------------------------');

  if (hasErrors) {
    console.log('\n🚨 [ACTIONS REQUISES POUR ACTIVER LA BASE DE DONNÉES CLOUD] :');
    console.log('  1. Rendez-vous sur votre tableau de bord Supabase :');
    console.log(`     ${targetUrl.replace('.supabase.co', '')}`);
    console.log('  2. Cliquez sur l\'onglet "SQL Editor" dans le menu gauche.');
    console.log('  3. Créez une "New query", collez le contenu du fichier schema.sql du projet, puis cliquez sur "Run".');
    console.log('  4. Vos tables "rapports" et "taches" seront créées en 2 secondes.');
    console.log('\n💡 Note : L\'application fonctionnera grâce au mode local en attendant l\'exécution du script SQL.');
  } else {
    console.log('\n🎉 PARFAIT : La connexion à la base de données Cloud est opérationnelle !');
    console.log('   Toutes les données seront synchronisées en temps réel.');
  }

  console.log('======================================================================\n');
}

runCheck().catch((err) => {
  console.error('Erreur lors du script de diagnostic :', err);
});
