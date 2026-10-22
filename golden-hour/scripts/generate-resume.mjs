import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { profile, professionalSummary, experience, skillGroups } from '../dist/profile.js';

const python = process.env.PORTFOLIO_PYTHON || 'python';
const result = spawnSync(python, [fileURLToPath(new URL('generate-resume.py', import.meta.url))], {
  input: JSON.stringify({ profile, professionalSummary, experience, skillGroups }), encoding: 'utf8',
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
if (result.status === 0) {
  const text = [profile.fullName || profile.name, profile.role, professionalSummary, 'EXPERIENCE',
    ...experience.flatMap(job => [`${job.company} | ${job.client}`, `${job.role} | ${job.dates}`, ...job.details.map(detail => `- ${detail}`), '']),
    'SKILLS & TOOLS', ...skillGroups.map(group => `${group.title}: ${group.skills.join(', ')}`)].join('\n\n');
  writeFileSync(fileURLToPath(new URL('../dist/assets/kirti-resume.txt', import.meta.url)), `${text}\n`, 'utf8');
}
