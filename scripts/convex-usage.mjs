import { spawnSync } from 'node:child_process';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const windows = { '7d': now - 7 * day, '30d': now - 30 * day };

function readTable(table) {
  const result = spawnSync('npx', ['convex', 'data', table, '--prod', '--limit', '10000', '--format', 'json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Could not read Convex table: ${table}`);
  if (!result.stdout.trim() && result.stderr.includes('There are no documents')) return [];
  try {
    return JSON.parse(result.stdout || '[]');
  } catch {
    throw new Error(`Could not parse Convex table: ${table}`);
  }
}

const tables = Object.fromEntries([
  'guestSearches', 'guestTrials', 'conversations', 'messages', 'users', 'wardrobeItems',
  'stylistSessions', 'tryOnPreviews', 'wardrobeOutfits', 'dailyFeeds', 'savedProducts',
  'waInbox', 'waOutbox',
].map((table) => [table, readTable(table)]));

const created = (rows, since) => rows.filter((row) => (row.createdAt ?? row._creationTime ?? 0) >= since);
const printRange = (label, since) => {
  const guests = created(tables.guestSearches, since);
  const messages = created(tables.messages, since);
  console.log(`${label}:`);
  console.log(`  Guest searches: ${guests.length} (${guests.filter((row) => row.state === 'ready').length} ready, ${guests.filter((row) => row.state === 'clarifying').length} awaiting a choice, ${guests.filter((row) => row.state === 'failed').length} failed)`);
  console.log(`  Signed-in user messages: ${messages.filter((row) => row.role === 'user').length}`);
  console.log(`  New signed-in conversations: ${created(tables.conversations, since).length}`);
  console.log(`  New accounts: ${created(tables.users, since).length}`);
  console.log(`  Guest try-on attempts: ${created(tables.guestTrials, since).reduce((n, row) => n + (row.tryOnAttempts ?? 0), 0)}`);
  console.log(`  Guest wardrobe analyses: ${created(tables.guestTrials, since).reduce((n, row) => n + (row.wardrobeAttempts ?? 0), 0)}`);
  console.log(`  Wardrobe items added: ${created(tables.wardrobeItems, since).length}`);
  console.log(`  Stylist sessions: ${created(tables.stylistSessions, since).length}`);
  console.log(`  Try-on previews: ${created(tables.tryOnPreviews, since).length}`);
  console.log(`  Wardrobe outfit requests: ${created(tables.wardrobeOutfits, since).length}`);
  console.log(`  Daily feeds created: ${created(tables.dailyFeeds, since).length}`);
  console.log(`  Products saved: ${created(tables.savedProducts, since).length}`);
  console.log(`  WhatsApp messages received: ${created(tables.waInbox, since).length}`);
  console.log(`  WhatsApp sends attempted: ${created(tables.waOutbox, since).length}`);
};

console.log(`Chauffeur production usage (UTC, data read directly from Convex)`);
console.log(`Rows read per table: up to 10,000 most recently created; private message text and customer details are not displayed.`);
printRange('Last 7 days', windows['7d']);
printRange('Last 30 days', windows['30d']);
console.log(`All-time rows in read window: ${Object.entries(tables).map(([name, rows]) => `${name} ${rows.length}`).join(' · ')}`);
