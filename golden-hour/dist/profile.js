// Add personal links here when ready. Empty links are never rendered as buttons.
export const profile = {
  name: 'Kirti',
  fullName: 'Kirti Joshi',
  role: 'Senior Software Engineer',
  portrait: '',
  email: 'kirti@example.com',
  linkedin: 'https://example.com/kirti/linkedin',
  github: 'https://example.com/kirti/github',
  contactIsDemo: true,
  experience: '8+',
};

// Add the final public HTTPS URL before publishing, then run npm run prepare:seo.
export const site = { url: '' };

// Replace these clearly marked samples with Kirti's own interests and memories.
export const personalFolders = [
  {
    id: 'interests', label: 'Interests', icon: 'folder', color: 'blue', sample: true,
    description: 'A little space for life beyond the screen.',
    entries: [
      { id: 'photography', title: 'Photography', type: 'Note', icon: 'camera', summary: 'Light, small details, and everyday scenes.', body: 'A camera roll full of ordinary moments: afternoon light, interesting shadows, and the little details that are easy to walk past. A sample interest, ready for Kirti’s own story.' },
      { id: 'weekends', title: 'Slow weekends', type: 'Note', icon: 'spark', summary: 'New places, long walks, and a change of pace.', body: 'A loose plan, a neighborhood to explore, and time to notice something new. Replace this sample with a favorite way to spend a weekend.' },
      { id: 'reading', title: 'Reading', type: 'Note', icon: 'book', summary: 'Ideas worth sitting with for a while.', body: 'Books, essays, and the occasional passage saved to read again. This sample can become a small collection of personal favorites.' },
    ],
  },
  {
    id: 'reading-list', label: 'Reading List', icon: 'folder', color: 'peach', sample: true,
    description: 'A small shelf of ideas to come back to.',
    entries: [
      { id: 'everyday-design', title: 'Everyday design', type: 'Reading note', icon: 'book', summary: 'Why some small interactions feel effortless.', body: 'A sample reading note about thoughtful details in everyday objects and digital interfaces. Add a real book, author, or article here later.' },
      { id: 'creative-routines', title: 'Creative routines', type: 'Reading note', icon: 'book', summary: 'Making a little room for curiosity.', body: 'A place for notes on finding inspiration, starting small, and building a creative habit. This is sample content rather than a claimed reading history.' },
      { id: 'saved-for-sunday', title: 'Saved for Sunday', type: 'Reading note', icon: 'file', summary: 'The longer reads that deserve a quiet hour.', body: 'A sample list for essays and stories worth saving for an unhurried afternoon. Replace it with a few favorite links or passages.' },
    ],
  },
  {
    id: 'snapshots', label: 'Snapshots', icon: 'folder', color: 'sage', sample: true,
    description: 'Small moments, collected along the way.',
    entries: [
      { id: 'by-the-water', title: 'By the water', type: 'Illustration', art: 'coast', summary: 'A sample frame for a favorite escape.', body: 'An illustrated placeholder for a real photograph. No location or personal travel history is implied.' },
      { id: 'city-light', title: 'City light', type: 'Illustration', art: 'city', summary: 'A sample frame for an everyday discovery.', body: 'An illustrated placeholder for a photograph of a place, a walk, or a small detail worth keeping.' },
      { id: 'a-change-of-scene', title: 'A change of scene', type: 'Illustration', art: 'hills', summary: 'A sample frame for somewhere memorable.', body: 'An illustrated placeholder ready to be replaced with Kirti’s own image and caption.' },
    ],
  },
];

export const professionalSummary = `Senior Software Engineer with ${profile.experience} years of experience building scalable React applications for enterprise and financial services. Focused on accessible interfaces, reusable component systems, maintainable architecture, and reliable feature delivery.`;

export const navigation = [
  { id: 'about', label: 'About', icon: 'person', color: 'rose' },
  { id: 'experience', label: 'Experience', icon: 'case', color: 'peach' },
  { id: 'work', label: 'Selected work', icon: 'grid', color: 'lavender' },
  { id: 'skills', label: 'Skills & toolkit', icon: 'code', color: 'blue' },
  { id: 'contact', label: 'Contact', icon: 'mail', color: 'sage' },
];

export const experience = [
  {
    company: 'Mphasis', client: 'HP', role: 'Senior Software Engineer',
    dates: 'Aug 2022 — Present', color: 'sage', brand: 'mphasis',
    summary: 'Building reliable experiences at enterprise scale.',
    details: [
      'Own and deliver end-to-end features in a large-scale React application, working closely with design, backend, and QA teams.',
      'Build reusable, customizable components in Storybook and improve modularity with hooks, higher-order components, and Context API.',
      'Write unit and integration tests with Jest and React Testing Library; resolve bugs and performance issues across modules.',
      'Lead an accessibility initiative covering WCAG guidelines, ARIA roles, and screen reader support.',
      'Review code, mentor junior developers, and contribute to sprint planning and Agile ceremonies.',
    ],
  },
  {
    company: 'Capgemini', client: 'Synchrony Bank', role: 'Consultant · UI Developer',
    dates: 'Jan 2021 — Aug 2022', color: 'blue', brand: 'capgemini',
    summary: 'Thoughtful interfaces for complex banking workflows.',
    details: [
      'Developed scalable interfaces with React 16.8 and 17, Redux, and TypeScript, with cross-browser and device compatibility.',
      'Partnered with business analysts and product owners to clarify UI requirements and deliver features on schedule.',
      'Implemented Redux actions and reducers and contributed to the React 17 upgrade.',
      'Used Storybook for isolated components and React Testing Library for unit and integration coverage.',
      'Conducted daily code reviews and maintained client coding standards.',
    ],
  },
  {
    company: 'Acnovate', client: '3D Portal · Adidas · Comment Tool', role: 'Software Developer',
    dates: 'Jul 2018 — Jan 2021', color: 'rose', brand: 'acnovate',
    summary: 'A foundation in responsive, component-driven development.',
    details: [
      'Built responsive interfaces for the 3D Portal using React and Redux, from September 2019 to January 2021.',
      'Developed UI components and application logic for the Adidas Development Extension Project with React 16.8, TypeScript, and HTML5, from October 2018 to September 2019.',
      'Integrated REST APIs for CRUD operations and implemented Excel data exports in the Comment Tool, from July to October 2018.',
      'Worked directly with stakeholders to refine requirements and collaborated with QA to troubleshoot issues.',
    ],
  },
];

export const projects = [
  { id: 'hp', title: 'Enterprise platform', client: 'HP · Mphasis', category: 'Enterprise', type: 'Design systems & accessibility', icon: 'layers', color: 'sage', description: 'Reusable components, reliable feature delivery, and an application-wide accessibility initiative.', contributions: ['Reusable Storybook components', 'WCAG, ARIA & screen reader improvements', 'Unit and integration test coverage'], stack: ['React', 'Storybook', 'Jest'], visual: 'system' },
  { id: 'synchrony', title: 'Banking interfaces', client: 'Synchrony Bank · Capgemini', category: 'Finance', type: 'Banking interfaces', icon: 'chart', color: 'peach', description: 'Scalable banking interfaces built around thoughtful state management and cross-device consistency.', contributions: ['React 17 upgrade contributions', 'Redux state management', 'Cross-browser and device compatibility'], stack: ['React', 'TypeScript', 'Redux'], visual: 'bank' },
  { id: 'portal', title: '3D portal', client: '3D Portal · Acnovate', category: 'Enterprise', type: 'Responsive application', icon: 'cube', color: 'lavender', description: 'Dynamic interfaces and reusable UI templates for a responsive, cross-platform portal.', contributions: ['Responsive React interfaces', 'Redux actions and reducers', 'Stakeholder-led requirements'], stack: ['React', 'Redux', 'CSS'], visual: 'portal' },
  { id: 'adidas', title: 'Development extensions', client: 'Adidas · Acnovate', category: 'Commerce', type: 'Development extension project', icon: 'grid', color: 'blue', description: 'Custom UI components and front-end logic shaped around project-specific requirements.', contributions: ['Custom React components', 'TypeScript application logic', 'Collaboration with QA and analysts'], stack: ['React', 'TypeScript', 'HTML5'], visual: 'adidas' },
  { id: 'comments', title: 'Reporting workflows', client: 'Comment Tool · Acnovate', category: 'Enterprise', type: 'Data & reporting workflows', icon: 'file', color: 'rose', description: 'API-connected workflows with data archiving and Excel exports for reporting and tracking.', contributions: ['REST API CRUD integration', 'Excel export functionality', 'Requirements analysis'], stack: ['JavaScript', 'REST APIs', 'Excel'], visual: 'comments' },
];

export const skillGroups = [
  { title: 'Front-end development', icon: 'code', color: 'blue', skills: ['React.js', 'JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'SASS', 'Bootstrap'] },
  { title: 'State & architecture', icon: 'layers', color: 'lavender', skills: ['Redux', 'Context API', 'React Hooks', 'Higher-order components', 'REST APIs'] },
  { title: 'Testing & quality', icon: 'check', color: 'sage', skills: ['Jest', 'React Testing Library', 'Enzyme', 'Storybook', 'Accessibility', 'Chrome DevTools'] },
  { title: 'Tools & collaboration', icon: 'tool', color: 'peach', skills: ['Git', 'Webpack', 'Babel', 'NPM', 'Jenkins', 'Figma', 'VS Code', 'Agile / Scrum', 'Jira'] },
];
