import { profile, professionalSummary, experience, projects, skillGroups } from './profile.js';
import { themes, modes } from './themes.js';
import { icon, escapeHtml as e } from './icons.js';
import { brandIcon } from './brands.js';

const tags = list => list.map(tag => `<span class="tag">${e(tag)}</span>`).join('');
const heading = (title, description) => `<div class="page-heading"><h1>${title}</h1><p>${description}</p></div>`;

function projectClient(project) {
  const logo = brandIcon(project.id);
  return `<span class="project-client">${logo ? `<span class="client-brand brand-mark" aria-hidden="true">${logo}</span>` : ''}<span class="eyebrow">${e(project.client)}</span></span>`;
}

function portrait() {
  const name = profile.fullName || profile.name;
  return `<div class="hero-portrait"><div class="portrait-frame ${profile.portrait ? 'has-image' : ''}">${profile.portrait ? `<img class="portrait-image" data-profile-photo src="${e(profile.portrait)}" alt="${e(name)}" width="900" height="1200" decoding="async">` : ''}<div class="portrait-placeholder" aria-label="Portrait placeholder">${icon('person')}<span class="portrait-initial">${e(name.slice(0, 1))}</span><span class="portrait-caption">Portrait</span></div></div></div>`;
}

export function desktopIdentity() {
  const name = profile.fullName || profile.name;
  return `<button class="desktop-profile-widget" id="profile-widget" type="button" data-nav="about" aria-label="Open ${e(name)}’s profile" aria-describedby="widget-move-help">${profile.portrait ? `<img class="profile-widget-photo" data-profile-photo src="${e(profile.portrait)}" alt="" width="218" height="248" decoding="async" draggable="false">` : ''}<span class="profile-widget-caption"><span class="profile-widget-copy"><strong class="profile-widget-name">${e(name)}</strong><span class="profile-widget-role">${e(profile.role)}</span></span><span class="profile-widget-open" aria-hidden="true">${icon('arrow')}</span></span></button><span class="visually-hidden" id="widget-move-help">Drag to move. Hold Shift and use the arrow keys to position the widget.</span>`;
}

export function aboutView() {
  return `<div class="about-page page">
    <span class="eyebrow">${e(profile.fullName || profile.name).toUpperCase()} / SENIOR SOFTWARE ENGINEER</span>
    <div class="hero"><div class="hero-copy"><h1>Complex products.<br><em>Clear experiences.</em></h1><p>${e(profile.experience)} years building reliable React applications for enterprise and financial services. Focused on accessible interfaces and maintainable architecture.</p><div class="hero-actions"><button class="primary-button" data-nav="work">Selected work ${icon('arrow')}</button><a class="text-button" href="assets/kirti-resume.pdf" download>Download résumé ${icon('download')}</a></div></div>${portrait()}</div>
    <div class="overview-footer"><div><span class="eyebrow">CURRENT ROLE</span><h2>Senior Software Engineer</h2><p>Mphasis · Client: HP <span>Aug 2022 — Present</span></p></div><button class="inline-link" data-nav="experience">View experience ${icon('arrowUp')}</button></div>
  </div>`;
}

export function experienceView() {
  return `<div class="page experience-page">${heading('Engineering across<br><em>enterprise teams.</em>', 'Feature ownership, accessibility, and technical collaboration across three organizations.')}<div class="timeline">${experience.map((job, index) => `<article class="timeline-job"><div class="timeline-marker brand-mark" aria-hidden="true">${brandIcon(job.brand)}</div><div class="job-content"><div class="job-topline"><span class="eyebrow">${e(job.client)}</span><span class="job-dates">${e(job.dates)}</span></div><h2>${e(job.company)}${index === 0 ? '<span>Current</span>' : ''}</h2><h3>${e(job.role)}</h3><p>${e(job.summary)}</p><details class="job-details" ${index === 0 ? 'open' : ''}><summary>Responsibilities & contributions ${icon('chevron')}</summary><ul>${job.details.map(detail => `<li>${e(detail)}</li>`).join('')}</ul></details></div></article>`).join('')}</div></div>`;
}

function projectVisual(project) {
  if (project.visual === 'system') return `<div class="mini-ui ui-system"><div class="mini-toolbar"><span></span><span></span><span></span><b>Component library</b></div><div class="mini-system-body"><div class="mini-nav"><i></i><i></i><i></i><i></i></div><div class="mini-component"><div class="mini-label">Consistent components. Accessible interfaces.</div><div class="mini-buttons"><b>Continue ${icon('arrow')}</b><span>Secondary</span></div><div class="mini-bars"><i></i><i></i><i></i></div></div><div class="mini-check">${icon('check')} Accessible by design</div></div></div>`;
  if (project.visual === 'bank') return `<div class="mini-ui ui-bank"><div class="mini-toolbar"><span></span><span></span><span></span><b>Account overview</b></div><div class="bank-body"><div><small>Financial overview</small><div class="bank-lines"><i></i><i></i></div></div><svg viewBox="0 0 240 65" aria-hidden="true"><path d="M0 60Q20 45 40 48T80 30T120 35T160 15T200 20T240 5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M0 60Q20 45 40 48T80 30T120 35T160 15T200 20T240 5V65H0Z" fill="currentColor" opacity=".08"/></svg><div class="bank-bottom"><span></span><span></span><span></span></div></div></div>`;
  return `<div class="mini-ui ui-generic"><div class="mini-toolbar"><span></span><span></span><span></span><b>${e(project.client.split(' · ')[0])}</b></div><div class="generic-body"><div class="generic-symbol">${icon(project.icon)}</div><div class="generic-lines"><i></i><i></i><i></i></div><div class="generic-tiles"><span></span><span></span><span></span></div></div></div>`;
}

export function workView(filter = 'All') {
  const filtered = filter === 'All' ? projects : projects.filter(project => project.category === filter);
  return `<div class="page work-page">${heading('Selected client work.', 'Professional contributions across enterprise platforms, banking, commerce, and reporting.')}<div class="work-filters" aria-label="Filter projects">${['All', 'Enterprise', 'Finance', 'Commerce'].map(item => `<button class="filter-button ${filter === item ? 'active' : ''}" data-filter="${item}" aria-pressed="${filter === item}">${item}${item === 'All' ? `<span>${projects.length}</span>` : ''}</button>`).join('')}</div><div class="projects-grid">${filtered.map(project => `<button class="project-card" data-project="${project.id}"><div class="project-visual ${project.color}" aria-hidden="true">${projectVisual(project)}<span class="visual-open">${icon('arrowUp')}</span></div><div class="project-copy">${projectClient(project)}<h2>${e(project.title)}</h2><p>${e(project.description)}</p><div class="project-stack">${project.stack.map(e).join('<span>·</span>')}</div></div></button>`).join('')}</div><p class="work-disclaimer">Interface previews are illustrative. Descriptions reflect professional contributions to client projects.</p></div>`;
}

export function skillsView() {
  return `<div class="page skills-page">${heading('A production-tested toolkit.', 'Technologies and practices used to build, test, and deliver web applications.')}<div class="skills-grid">${skillGroups.map(group => `<article class="skill-group"><div class="skill-group-icon ${group.color}">${icon(group.icon)}</div><h2>${e(group.title)}</h2><div class="skill-tags">${tags(group.skills)}</div></article>`).join('')}</div></div>`;
}

export function contactView() {
  const links = [
    profile.email ? { href: `mailto:${profile.email}`, label: 'Email', detail: profile.email, icon: 'mail' } : null,
    profile.linkedin ? { href: safeUrl(profile.linkedin), label: 'LinkedIn', detail: 'Professional profile', icon: 'linkedin' } : null,
    profile.github ? { href: safeUrl(profile.github), label: 'GitHub', detail: 'Code & repositories', icon: 'github' } : null,
  ].filter(link => link && link.href);
  return `<div class="page contact-page">${heading('Let’s discuss<br><em>your next project.</em>', 'For senior engineering roles, technical collaboration, and product development opportunities.')}${profile.contactIsDemo ? '<span class="demo-contact-badge">Sample contact details</span>' : ''}<div class="contact-links">${links.length ? links.map(link => `<a class="contact-link" href="${e(link.href)}" ${link.icon !== 'mail' ? 'target="_blank" rel="noopener noreferrer"' : ''}><span class="${link.icon !== 'mail' ? 'brand-mark' : ''}">${link.icon === 'mail' ? icon('mail') : brandIcon(link.icon)}</span><div><strong>${e(link.label)}</strong><p>${e(link.detail)}</p></div>${icon('arrowUp')}</a>`).join('') : `<div class="contact-pending">${icon('mail')}<div><strong>Contact details will be added soon.</strong><p>Download the résumé for a complete overview of experience and skills.</p></div></div>`}</div><a class="primary-button" href="assets/kirti-resume.pdf" download>Download résumé ${icon('download')}</a></div>`;
}

export function resumeView() {
  return `<div class="page resume-page"><div class="resume-heading"><div><h1>${e(profile.fullName || profile.name)}<em> ${e(profile.role)}</em></h1></div><a class="primary-button" href="assets/kirti-resume.pdf" download>${icon('download')} Download PDF</a></div><p class="resume-summary">${e(professionalSummary)}</p><h2 class="resume-section-label">Experience</h2>${experience.map(job => `<article class="resume-job"><div><h3>${e(job.company)} <span>· ${e(job.client)}</span></h3><span class="job-dates">${e(job.dates)}</span></div><h4>${e(job.role)}</h4><ul>${job.details.map(detail => `<li>${e(detail)}</li>`).join('')}</ul></article>`).join('')}<h2 class="resume-section-label">Skills & tools</h2>${skillGroups.map(group => `<p class="resume-skill"><strong>${e(group.title)}</strong> ${group.skills.map(e).join(' · ')}</p>`).join('')}</div>`;
}

export function appearanceView() {
  const paletteOptions = Object.entries(themes).map(([id, theme]) => `<button class="theme-option" data-theme="${id}" aria-pressed="false" style="--preview-start:${theme.light.folds[0]};--preview-middle:${theme.light.wallpaper};--preview-end:${theme.light.folds[1]};--preview-panel:${theme.light.panel}"><span class="theme-preview" aria-hidden="true"></span><strong>${theme.label}</strong><small>${theme.description}</small></button>`).join('');
  const modeOptions = Object.entries(modes).map(([id, label]) => `<button data-mode="${id}" aria-pressed="false">${icon(id === 'light' ? 'sun' : 'moon')}${label}</button>`).join('');
  return `<div class="page appearance-page">${heading('Appearance & sound.', 'A workspace that feels like you. Saved on this device.')}<div class="appearance-mode-row"><span>Appearance</span><div class="mode-options" role="group" aria-label="Light or dark appearance">${modeOptions}</div></div><div class="theme-options" role="group" aria-label="Color palette">${paletteOptions}</div><div class="preference-row"><div><strong>Glass depth</strong><span>Lightly frosted to softly diffused</span></div><input type="range" min="35" max="95" value="72" data-glass-range aria-label="Glass frosting intensity"></div><div class="preference-row"><div><strong>Tint glass</strong><span>Add a subtle color cast from your palette</span></div><button class="preference-switch tint-switch" data-action="tint" role="switch" aria-checked="false" aria-label="Tint glass"><span></span></button></div><div class="preference-row"><div><strong>Interface sounds</strong><span>Subtle feedback when activating controls</span></div><button class="preference-switch sound-switch" data-action="sound" role="switch" aria-checked="true" aria-label="Interface sounds"><span></span></button></div><div class="preference-row welcome-preference"><div><strong>Welcome greeting</strong><span>Plays automatically on your first visit</span></div><button class="preview-greeting" data-action="replay-welcome">Replay ${icon('arrowUp')}</button></div></div>`;
}

export function projectDetail(id) {
  const project = projects.find(item => item.id === id);
  if (!project) return '';
  return `<button class="dialog-close icon-button" data-close="project-dialog" aria-label="Close project details">${icon('close')}</button><div class="project-detail-visual ${project.color}" aria-hidden="true">${projectVisual(project)}</div><div class="project-detail-content">${projectClient(project)}<h2>${e(project.title)}</h2><p>${e(project.description)}</p><h3>My contributions</h3><ul>${project.contributions.map(item => `<li>${icon('check')} ${e(item)}</li>`).join('')}</ul><div class="tag-list">${tags(project.stack)}</div><div class="project-detail-note">${icon('info')} Client work · Illustrative interface preview</div></div>`;
}

function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
}

export const views = { about: aboutView, experience: experienceView, work: workView, skills: skillsView, contact: contactView, resume: resumeView, appearance: appearanceView };
