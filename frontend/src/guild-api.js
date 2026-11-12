export const ACCESS_TOKEN_KEY = 'questify_access_token';

export async function readApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`A API retornou uma resposta inválida (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const error = new Error(data.message || `Erro da API (HTTP ${response.status}).`);
    error.status = response.status;
    error.code = data.code;
    error.fields = data.fields;
    throw error;
  }

  return data;
}

function authenticatedHeaders() {
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function fetchCategories() {
  const response = await fetch('/api/v1/guild-categories', {
    headers: authenticatedHeaders(),
  });
  return readApiResponse(response);
}

export async function createGuild(payload) {
  const response = await fetch('/api/v1/guilds', {
    method: 'POST',
    headers: {
      ...authenticatedHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return readApiResponse(response);
}
