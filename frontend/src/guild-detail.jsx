import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ACCESS_TOKEN_KEY } from './guild-api.js';
import '../style.css';

function GuildDetailPage() {
  const guildId = window.location.pathname.split('/').filter(Boolean).pop();
  useEffect(() => {
    if (!window.localStorage.getItem(ACCESS_TOKEN_KEY)) window.location.assign('/index.html');
  }, []);

  let guild = null;
  try {
    guild = JSON.parse(window.sessionStorage.getItem('questify_created_guild') || 'null');
  } catch {
    guild = null;
  }

  return (
    <main className="page-container">
      <section className="guild-card" aria-labelledby="guild-detail-title">
        <p className="eyebrow">Guilda criada</p>
        <h1 id="guild-detail-title">{guild?.name || 'Sua guilda de estudos'}</h1>
        <p className="subtitle">
          A guilda foi criada com sucesso. Você é o Administrador deste grupo.
        </p>
        <dl className="guild-summary">
          <div><dt>ID da guilda</dt><dd>{guildId}</dd></div>
          {guild?.categoryId && <div><dt>Categoria</dt><dd>{guild.categoryId}</dd></div>}
          <div><dt>Seu papel</dt><dd>Administrador</dd></div>
        </dl>
        <a className="btn-primary btn-link" href="/guilds">Criar outra guilda</a>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><GuildDetailPage /></React.StrictMode>,
);
