import { myGuilds } from '@/mocks/guilds';
import { mockList } from './mock-utils';

// TODO(api): trocar por GET /api/v1/guilds?member=me (ordenado por atividade recente)
export async function listMyGuilds() {
  const guilds = await mockList(myGuilds);
  return guilds.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
}
