// Utilitários dos serviços mockados.
//
// Para conferir os estados de erro, force a falha de qualquer mock com
// `?mock=error` na URL (ex.: /guilds?mock=error) ou com
// NEXT_PUBLIC_MOCK_ERROR=1 no ambiente de desenvolvimento.

const DEFAULT_DELAY_MS = 600;

function shouldFail() {
  if (process.env.NEXT_PUBLIC_MOCK_ERROR === '1') return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('mock') === 'error';
}

/** Resolve `value` (clonado) depois de um pequeno atraso, ou rejeita se o erro estiver forçado. */
export function mockResponse(value, delay = DEFAULT_DELAY_MS) {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (shouldFail()) {
        reject(new Error('Falha simulada do mock.'));
        return;
      }
      resolve(structuredClone(value));
    }, delay);
  });
}
