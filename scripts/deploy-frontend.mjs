import {spawnSync} from 'node:child_process';
import {loadEnv} from 'vite';
import {readFileSync} from 'node:fs';

const linked = JSON.parse(readFileSync(new URL('../.vercel/project.json', import.meta.url), 'utf8'));
if (linked.projectId !== 'prj_FlxyrSutzlip53bHH8b0WAGKnlyf') throw new Error('Link this checkout to the chauffer Vercel project before deploying.');

// Only public browser configuration goes to Vercel. Provider/auth keys stay in Convex.
const local = loadEnv('production', process.cwd(), 'VITE_');
const publicSettings = {
  VITE_CONVEX_URL: 'https://rare-chameleon-828.convex.cloud',
  ...Object.fromEntries(['VITE_POSTHOG_KEY', 'VITE_POSTHOG_HOST'].flatMap(name => {
    const value = process.env[name] || local[name];
    return value ? [[name, value]] : [];
  })),
};
const args = ['--yes', 'vercel@65.1.0', 'deploy', '--prod', '--yes'];
for (const [name, value] of Object.entries(publicSettings)) args.push('--build-env', `${name}=${value}`);
const result = spawnSync('npx', args, {stdio:'inherit'});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
