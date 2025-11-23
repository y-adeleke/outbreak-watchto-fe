export const siteConfig = {
  name: 'OutbreakWatch TO',
  description:
    'Live outbreak intelligence for Toronto long-term care and congregate settings.',
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/outbreaks', label: 'Outbreaks' },
    { href: '/facilities', label: 'Facilities' },
    { href: '/case-stats', label: 'Case stats' },
    { href: '/playground', label: 'Playground' },
  ],
  contactEmail: 'ops@outbreakwatch.to',
  github: 'https://github.com/',
  linkedin: 'https://www.linkedin.com/',
};

export type NavItem = (typeof siteConfig.nav)[number];
