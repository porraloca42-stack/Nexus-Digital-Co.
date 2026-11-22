export const DEFAULT_LIMIT = 1000;

export function cleanSource(value) {
  const source = String(value || 'direto').toLowerCase();
  return /^[a-z0-9-]{1,40}$/.test(source) ? source : 'direto';
}

export function dateInSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const get = (key) => parts.find((item) => item.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isAllowedGroupLink(link) {
  try {
    const parsed = new URL(link);
    return parsed.protocol === 'https:' &&
      ['chat.whatsapp.com', 'whatsapp.com', 't.me', 'telegram.me'].includes(parsed.hostname) &&
      !parsed.username && !parsed.password &&
      parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

export function validateConfig(input) {
  const limit = Number(input?.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000000) {
    throw new Error('O limite precisa ser um número inteiro entre 1 e 1.000.000.');
  }
  if (!Array.isArray(input?.groups) || input.groups.length > 100) {
    throw new Error('Envie até 100 grupos.');
  }
  const seen = new Set();
  const groups = input.groups.map((group, i) => {
    const id = String(group?.id ?? '').trim();
    const url = String(group?.url ?? '').trim();
    if (!/^[a-z0-9-]{1,40}$/.test(id) || seen.has(id)) {
      throw new Error(`ID inválido ou repetido no grupo ${i + 1}.`);
    }
    if (!isAllowedGroupLink(url)) {
      throw new Error(`O grupo ${i + 1} precisa ter um convite HTTPS válido do WhatsApp ou Telegram.`);
    }
    seen.add(id);
    return { id, url };
  });
  return { limit, groups };
}

export function nextClick(config, metrics, source, day) {
  const groups = config.groups;
  const limit = config.limit;
  if (!groups.length) return { target: null, metrics, reason: 'no_groups' };
  const next = structuredClone(metrics || {});
  next.byGroup ||= {};
  next.bySource ||= {};
  next.byDaySource ||= {};
  next.total ||= 0;
  next.groupIndex ||= 0;
  let index = Math.max(0, Math.min(next.groupIndex, groups.length - 1));
  while (index < groups.length && (next.byGroup[groups[index].id] || 0) >= limit) index++;
  if (index >= groups.length) return { target: null, metrics: next, reason: 'limit_reached' };
  const group = groups[index];
  next.groupIndex = index;
  next.byGroup[group.id] = (next.byGroup[group.id] || 0) + 1;
  next.bySource[source] = (next.bySource[source] || 0) + 1;
  const dailyKey = `${day}|${source}`;
  next.byDaySource[dailyKey] = (next.byDaySource[dailyKey] || 0) + 1;
  next.total++;
  return { target: group, metrics: next, reason: 'ok' };
}

export function retainMetricsForGroups(metrics, groups) {
  const ids = new Set(groups.map((g) => g.id));
  const byGroup = {};
  for (const [id, clicks] of Object.entries(metrics?.byGroup || {})) {
    if (ids.has(id)) byGroup[id] = clicks;
  }
  return { ...metrics, byGroup, groupIndex: 0 };
}