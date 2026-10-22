import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { profile } from '../dist/profile.js';

const result = spawnSync(process.env.PORTFOLIO_PYTHON || 'python', [fileURLToPath(new URL('./generate-social-card.py', import.meta.url))], {
  input: JSON.stringify(profile), encoding: 'utf8',
});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `Social card authoring failed: ${result.status}`);
console.log(result.stdout.trim());
