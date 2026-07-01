import { hashPasscode } from './session.js';

export const defaultMembers = [
  { id: 'alex', slug: 'alex', display_name: 'Alex', accent_key: 'gold' },
  { id: 'sarah', slug: 'sarah', display_name: 'Sarah', accent_key: 'blue' },
  { id: 'rahul', slug: 'rahul', display_name: 'Rahul', accent_key: 'green' },
  { id: 'maya', slug: 'maya', display_name: 'Maya', accent_key: 'coral' }
];

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function validatePasscodes(passcodes) {
  const missing = defaultMembers.filter((member) => !passcodes?.[member.id]);
  if (missing.length) {
    throw new Error(`Missing passcodes for: ${missing.map((member) => member.id).join(', ')}`);
  }
}

export async function generateSeedSql(passcodes, secret, options = {}) {
  validatePasscodes(passcodes);

  const timestamp = options.timestamp || new Date().toISOString();
  const memberRows = defaultMembers
    .map(
      (member) =>
        `  (${sqlString(member.id)}, ${sqlString(member.slug)}, ${sqlString(member.display_name)}, ${sqlString(
          member.accent_key
        )}, 1, ${sqlString(timestamp)})`
    )
    .join(',\n');

  const credentialRows = (
    await Promise.all(
      defaultMembers.map(async (member) => {
        const passcodeHash = await hashPasscode(String(passcodes[member.id]), secret);
        return `  (${sqlString(member.id)}, ${sqlString(passcodeHash)}, ${sqlString(timestamp)}, null)`;
      })
    )
  ).join(',\n');

  return [
    'delete from member_credentials;',
    'delete from members;',
    '',
    'insert into members (id, slug, display_name, accent_key, is_active, created_at)',
    'values',
    `${memberRows};`,
    '',
    'insert into member_credentials (member_id, passcode_hash, created_at, rotated_at)',
    'values',
    `${credentialRows};`
  ].join('\n');
}
