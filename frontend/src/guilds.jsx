import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ACCESS_TOKEN_KEY, createGuild, fetchCategories } from './guild-api.js';
import '../style.css';

const normalizeName = (value) => value.normalize('NFC').replace(/\s+/g, ' ').trim();

function redirectToLogin() {
  window.location.assign('/index.html');
}

function GuildCreationPage() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((data) => {
        if (active) setCategories(data.categories);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          window.localStorage.removeItem(ACCESS_TOKEN_KEY);
          redirectToLogin();
          return;
        }
        setError(requestError.message || 'Não foi possível carregar as categorias.');
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const nameLength = useMemo(() => Array.from(normalizeName(name)).length, [name]);
  const nameIsValid = nameLength >= 3 && nameLength <= 50;
  const canSubmit = !loadingCategories && !submitting && nameIsValid && Boolean(categoryId);

  function updateName(event) {
    setName(event.target.value);
    setFieldErrors((current) => ({ ...current, name: undefined }));
    setError('');
  }

  function updateCategory(event) {
    setCategoryId(event.target.value);
    setFieldErrors((current) => ({ ...current, categoryId: undefined }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const normalizedName = normalizeName(name);
    const errors = {};
    if (Array.from(normalizedName).length < 3 || Array.from(normalizedName).length > 50) {
      errors.name = 'O nome da guilda deve ter entre 3 e 50 caracteres.';
    }
    if (!categoryId) errors.categoryId = 'Selecione uma categoria válida.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const guild = await createGuild({ name: normalizedName, categoryId });
      window.sessionStorage.setItem('questify_created_guild', JSON.stringify(guild));
      window.location.assign(`/guilds/${encodeURIComponent(guild.id)}`);
    } catch (requestError) {
      if (requestError.status === 401) {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        redirectToLogin();
        return;
      }
      if (requestError.status === 409) {
        setError('Este nome de guilda já está em uso, escolha outro.');
      } else if (requestError.status === 400 && requestError.fields) {
        setFieldErrors(requestError.fields);
      } else {
        setError(requestError.message || 'Não foi possível criar a guilda.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-container">
      <section className="guild-card" aria-labelledby="guild-title">
        <p className="eyebrow">Comunidade Questify</p>
        <h1 id="guild-title">Criar guilda de estudos</h1>
        <p className="subtitle">Reúna estudantes interessados nos mesmos conteúdos.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className={`input-group ${fieldErrors.name ? 'has-error' : ''}`}>
            <label htmlFor="guild-name">Nome da guilda</label>
            <input
              id="guild-name"
              type="text"
              value={name}
              onChange={updateName}
              maxLength="50"
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'guild-name-error' : undefined}
              placeholder="Ex.: Matemática Avançada"
            />
            {fieldErrors.name && <span id="guild-name-error" className="field-error">{fieldErrors.name}</span>}
          </div>

          <div className={`input-group ${fieldErrors.categoryId ? 'has-error' : ''}`}>
            <label htmlFor="guild-category">Categoria</label>
            <select
              id="guild-category"
              value={categoryId}
              onChange={updateCategory}
              required
              disabled={loadingCategories}
              aria-invalid={Boolean(fieldErrors.categoryId)}
              aria-describedby={fieldErrors.categoryId ? 'guild-category-error' : undefined}
            >
              <option value="">{loadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {fieldErrors.categoryId && <span id="guild-category-error" className="field-error">{fieldErrors.categoryId}</span>}
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}
          <button className="btn-primary" type="submit" disabled={!canSubmit}>
            {submitting ? 'Criando...' : 'Criar Guilda'}
          </button>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><GuildCreationPage /></React.StrictMode>,
);
