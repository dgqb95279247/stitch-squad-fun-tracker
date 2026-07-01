import { generateSeedSql } from '../worker/src/seed.js';

const SESSION_SECRET = process.env.SESSION_SECRET || '';
const SEED_PASSCODES = process.env.SEED_PASSCODES || '';

function parsePasscodes(input) {
  if (!input.trim()) {
    throw new Error(
      'Missing SEED_PASSCODES. Example: alex=1111,sarah=2222,rahul=3333,maya=4444'
    );
  }

  return input.split(',').reduce((accumulator, pair) => {
    const [rawKey, ...rawValueParts] = pair.split('=');
    const key = (rawKey || '').trim();
    const value = rawValueParts.join('=').trim();

    if (key && value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

async function main() {
  if (!SESSION_SECRET.trim()) {
    throw new Error('Missing SESSION_SECRET environment variable');
  }

  const passcodes = parsePasscodes(SEED_PASSCODES);
  const sql = await generateSeedSql(passcodes, SESSION_SECRET);
  process.stdout.write(`${sql}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
