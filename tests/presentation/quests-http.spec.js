// Squad 2 — adaptador HTTP da Vercel/servidor local (api/_lib/quests-http.js) (Jest).
// Só cenários que não chegam ao banco: método errado e cabeçalhos da resposta.
const { quests, categories } = require('../../api/_lib/quests-http.js');

function fakeResponse() {
  const res = { headers: {}, statusCode: 0, body: undefined };
  res.setHeader = (name, value) => { res.headers[name.toLowerCase()] = value; };
  res.end = (payload) => { res.body = JSON.parse(payload); return res; };
  return res;
}

describe('quests-http (adaptador)', () => {
  test('GET em /api/v1/quests -> 405 JSON, sem cache e com Allow: POST', async () => {
    const res = fakeResponse();
    await quests({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers.allow).toBe('POST');
    expect(res.body.code).toBeTruthy();
  });

  test('DELETE em /api/v1/quest-categories -> 405 com Allow: GET', async () => {
    const res = fakeResponse();
    await categories({ method: 'DELETE', headers: {} }, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe('GET');
  });

  test('Content-Length bate com o corpo enviado', async () => {
    const res = fakeResponse();
    await quests({ method: 'PUT', headers: {} }, res);
    expect(res.headers['content-length']).toBe(Buffer.byteLength(JSON.stringify(res.body)));
  });
});
