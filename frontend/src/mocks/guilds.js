// Fixtures de guildas com os dados do Figma.

/** "Suas guildas" no Início (frames 4:2 e 5:2). `lastActivityAt` define o destaque. */
export const myGuilds = [
  {
    id: '1',
    name: 'Cálculo I — Turma A',
    memberCount: 12,
    members: [
      { initials: 'AS', tone: 'white' },
      { initials: 'MR', tone: 'success' },
      { initials: 'LF', tone: 'gold' },
    ],
    unread: 3,
    lastActivityAt: '2026-11-05T14:00:00-03:00',
  },
  {
    id: '2',
    name: 'Anatomia Veterinária',
    memberCount: 8,
    members: [
      { initials: 'JP', tone: 'primary-dark' },
      { initials: 'CM', tone: 'success' },
      { initials: 'RT', tone: 'gold' },
    ],
    unread: 0,
    lastActivityAt: '2026-11-04T09:30:00-03:00',
  },
  {
    id: '3',
    name: 'Estudos de Educação Física',
    memberCount: 15,
    members: [
      { initials: 'TS', tone: 'primary' },
      { initials: 'BN', tone: 'success' },
      { initials: 'VA', tone: 'primary-dark' },
    ],
    unread: 1,
    lastActivityAt: '2026-11-03T18:15:00-03:00',
  },
];
