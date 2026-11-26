import { test, expect } from '@playwright/test';

async function openGuildCreation(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('questify_access_token', 'e2e-guild-token');
  });
  await page.route('**/api/v1/guild-categories', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ categories: [{ id: 3, name: 'Tecnologia' }] }),
    });
  });

  await page.goto('/guilds');
  await page.getByRole('button', { name: 'Criar guilda' }).click();
  const dialog = page.getByRole('dialog', { name: 'Criar guilda' });
  await expect(dialog.getByRole('option', { name: 'Tecnologia' })).toBeAttached();
  return dialog;
}

test.describe('Criação de guilda', () => {
  test('cria a guilda e redireciona para a confirmação', async ({ page }) => {
    const dialog = await openGuildCreation(page);
    let requestData;
    await page.route('**/api/v1/guilds', async (route) => {
      requestData = {
        method: route.request().method(),
        authorization: route.request().headers().authorization,
        body: route.request().postDataJSON(),
      };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 42, name: 'Matemática Avançada', categoryId: 3 }),
      });
    });

    await dialog.getByLabel('Nome da guilda').fill('  Matemática   Avançada ');
    await dialog.getByLabel('Categoria').selectOption('3');
    await dialog.getByRole('button', { name: 'Criar guilda' }).click();

    await expect(page).toHaveURL(/\/guilds\/42$/);
    await expect(page.getByRole('heading', { name: 'Matemática Avançada' })).toBeVisible();
    await expect(page.getByText('Tecnologia', { exact: true })).toBeVisible();
    await expect(page.getByText('Administrador', { exact: true })).toBeVisible();
    expect(requestData).toEqual({
      method: 'POST',
      authorization: 'Bearer e2e-guild-token',
      body: { name: 'Matemática Avançada', categoryId: '3' },
    });
  });

  test('mostra erros locais e não envia dados inválidos', async ({ page }) => {
    const dialog = await openGuildCreation(page);
    let createRequestCount = 0;
    await page.route('**/api/v1/guilds', async (route) => {
      createRequestCount += 1;
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await dialog.getByRole('button', { name: 'Criar guilda' }).click();

    await expect(dialog.getByText('O nome da guilda deve ter entre 3 e 30 caracteres.')).toBeVisible();
    await expect(dialog.getByText('Selecione uma categoria válida.')).toBeVisible();
    expect(createRequestCount).toBe(0);
  });

  test('mostra erro de conflito quando o nome já está em uso', async ({ page }) => {
    const dialog = await openGuildCreation(page);
    await page.route('**/api/v1/guilds', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'GUILD_NAME_ALREADY_USED',
          message: 'Este nome de guilda já está em uso, escolha outro.',
        }),
      });
    });

    await dialog.getByLabel('Nome da guilda').fill('Guilda de Teste');
    await dialog.getByLabel('Categoria').selectOption('3');
    await dialog.getByRole('button', { name: 'Criar guilda' }).click();

    await expect(dialog.getByText('Este nome de guilda já está em uso, escolha outro.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
