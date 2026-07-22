import { expect, request as playwrightRequest, test, type APIRequestContext, type Page } from "@playwright/test";

const password = "OpenImpactDemo2026!";
const invitationPassword = "GestaoEJ#2027Forte";
const runId = Date.now().toString(36);
let projectId = "";
let meetingId = "";
let loginCounter = 10;

async function loginApi(api: APIRequestContext, email = "demo@openimpact.local") {
  const login = await api.post("/api/auth/login", { headers: { "x-forwarded-for": `198.51.100.${loginCounter++}` }, data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const result = await login.json();
  if (result.requiresOrganizationSelection) {
    const optionsResponse = await api.get("/api/auth/organizations");
    expect(optionsResponse.ok()).toBeTruthy();
    const options = await optionsResponse.json();
    const organization = options.organizations.find((item: { name: string }) => item.name.includes("Demonstração"));
    expect(organization).toBeTruthy();
    const selection = await api.post("/api/auth/organizations", { data: { organizationKey: organization.organizationKey } });
    expect(selection.ok()).toBeTruthy();
  }
}

async function loginPage(page: Page, email = "demo@openimpact.local") {
  await loginApi(page.request, email);
  await page.goto("/inicio");
  await expect(page.getByRole("heading", { name: "Visão geral da EJ" })).toBeVisible();
}

async function settings(api: APIRequestContext) {
  const response = await api.get("/api/settings");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe.configure({ mode: "serial" });

test("login com seleção explícita de organização", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("demo@openimpact.local");
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/selecionar-organizacao/);
  await page.getByRole("button", { name: /EJ Demonstração/ }).click();
  await expect(page).toHaveURL(/inicio/);
});

test("Home inicia no contexto Minha diretoria", async ({ page }) => {
  await loginPage(page);
  await expect(page.getByRole("button", { name: "Minha diretoria" })).toHaveClass(/bg-zinc-950/);
  await expect(page.getByText("Visualizando: Projetos")).toBeVisible();
});

test("cria projeto e tarefa com múltiplos responsáveis", async ({ page }) => {
  await loginPage(page);
  const data = await settings(page.request);
  const directorates = data.directorates as Array<{ id: string; name: string }>;
  const members = data.members as Array<{ id: string }>;
  const project = await page.request.post("/api/projects", {
    data: {
      name: `Projeto E2E ${runId}`,
      primaryDirectorateId: directorates[0].id,
      directorateIds: directorates.map((item) => item.id),
      teamMemberIds: members.map((item) => item.id),
      status: "ACTIVE",
    },
  });
  expect(project.status()).toBe(201);
  projectId = (await project.json()).project.id;
  const task = await page.request.post("/api/tasks", {
    data: { title: `Tarefa E2E ${runId}`, projectId, directorateId: directorates[0].id, assigneeIds: members.map((item) => item.id), priority: "HIGH" },
  });
  expect(task.status()).toBe(201);
  expect((await task.json()).task.assignees).toHaveLength(members.length);
  await page.goto("/projetos");
  await expect(page.getByText(`Projeto E2E ${runId}`)).toBeVisible();
});

test("agenda reunião para duas diretorias e participantes diretos", async ({ page }) => {
  await loginPage(page);
  const data = await settings(page.request);
  const response = await page.request.post("/api/meetings", {
    data: {
      title: `Reunião E2E ${runId}`,
      startLocal: "2027-02-10T10:00",
      endLocal: "2027-02-10T11:00",
      timezone: "America/Sao_Paulo",
      directorateIds: data.directorates.map((item: { id: string }) => item.id),
      participantIds: data.members.map((item: { id: string }) => item.id),
      idempotencyKey: crypto.randomUUID(),
      status: "SCHEDULED",
      confirmConflicts: true,
      overrideReason: "Validação E2E",
    },
  });
  const result = await response.json();
  expect(response.status(), JSON.stringify(result)).toBe(201);
  meetingId = result.meeting.id;
  expect(result.meeting.participants.length).toBeGreaterThanOrEqual(2);
});

test("membro responde ao convite de reunião", async ({ browser }) => {
  expect(meetingId).toBeTruthy();
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3107" });
  await loginApi(context.request, "membro@openimpact.local");
  const response = await context.request.post(`/api/meetings/${meetingId}/respond`, {
    data: { status: "ACCEPTED", eventId: crypto.randomUUID() },
  });
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).status).toBe("ACCEPTED");
  await context.close();
});

test("cria pesquisa e registra disponibilidade", async ({ page }) => {
  await loginPage(page);
  const data = await settings(page.request);
  const response = await page.request.post("/api/availability/polls", {
    data: { title: `Disponibilidade E2E ${runId}`, dates: ["2027-02-11"], startMinute: 540, endMinute: 720, slotMinutes: 30, participantIds: data.members.map((item: { id: string }) => item.id) },
  });
  expect(response.status()).toBe(201);
  const poll = (await response.json()).poll;
  const detail = await page.request.get(`/api/availability/polls/${poll.id}`);
  const slot = (await detail.json()).poll.slots[0].startAt;
  const saved = await page.request.put(`/api/availability/polls/${poll.id}`, { data: { slots: [slot] } });
  expect(saved.ok()).toBeTruthy();
});

test("cria e cancela lançamento financeiro em centavos", async ({ page }) => {
  await loginPage(page);
  const created = await page.request.post("/api/finances", { data: { direction: "PAYABLE", description: `Despesa E2E ${runId}`, totalCents: 12345, competenceDate: "2027-02-01", dueDate: "2027-02-15" } });
  expect(created.status()).toBe(201);
  const entry = (await created.json()).entry;
  expect(entry.totalCents).toBe(12345);
  const cancelled = await page.request.patch(`/api/finances/${entry.id}`, { data: { version: entry.version, cancelReason: "Cancelamento E2E" } });
  expect(cancelled.ok()).toBeTruthy();
  expect((await cancelled.json()).entry.status).toBe("CANCELLED");
});

test("convite usa token opaco e não o devolve na prévia", async ({ page }) => {
  await loginPage(page);
  const email = `seguro-${runId}@openimpact.local`;
  const created = await page.request.post("/api/settings/invitations", { data: { email, organizationPosition: "MEMBER", memberCategory: "MEMBER" } });
  expect(created.status()).toBe(201);
  const invitationUrl = (await created.json()).invitationUrl as string;
  expect(invitationUrl).toMatch(/\/convite\/[A-Za-z0-9_-]{40,}$/);
  const isolated = await playwrightRequest.newContext({ baseURL: "http://127.0.0.1:3107" });
  const preview = await isolated.get(new URL(invitationUrl).pathname.replace("/convite/", "/api/invitations/"));
  const previewBody = await preview.json();
  expect(preview.ok()).toBeTruthy();
  expect(previewBody.email).toBe(email);
  expect(JSON.stringify(previewBody)).not.toContain(new URL(invitationUrl).pathname.split("/").at(-1));
  const invalid = await isolated.get(`/api/invitations/${"x".repeat(48)}`);
  expect(invalid.status()).toBe(404);
  await isolated.dispose();
});

test("aceita convite e ativa um novo membro", async ({ page }) => {
  await loginPage(page);
  const email = `novo-${runId}@openimpact.local`;
  const created = await page.request.post("/api/settings/invitations", { data: { email, organizationPosition: "MEMBER", memberCategory: "TRAINEE" } });
  const invitationUrl = (await created.json()).invitationUrl as string;
  const isolated = await playwrightRequest.newContext({ baseURL: "http://127.0.0.1:3107" });
  const accepted = await isolated.post(new URL(invitationUrl).pathname.replace("/convite/", "/api/invitations/"), { data: { fullName: "Novo Membro E2E", password: invitationPassword, passwordConfirmation: invitationPassword } });
  const acceptedBody = await accepted.json();
  expect(accepted.ok(), JSON.stringify(acceptedBody)).toBeTruthy();
  const login = await isolated.post("/api/auth/login", { data: { email, password: invitationPassword } });
  expect(login.ok()).toBeTruthy();
  await isolated.dispose();
});

test("membro comum não acessa ajustes", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:3107" });
  await loginApi(context.request, "membro@openimpact.local");
  const response = await context.request.get("/api/settings");
  expect(response.status()).toBe(403);
  await context.close();
});

test("transfere a Presidência com confirmação explícita", async ({ page }) => {
  await loginPage(page);
  const data = await settings(page.request);
  const target = data.members.find((item: { email: string }) => item.email === "membro@openimpact.local");
  const rejected = await page.request.post("/api/settings/presidency", { data: { memberId: target.id } });
  expect(rejected.status()).toBe(422);
  const transferred = await page.request.post("/api/settings/presidency", { data: { memberId: target.id, confirmPresidentTransfer: true } });
  expect(transferred.ok()).toBeTruthy();
  expect((await transferred.json()).member.organizationPosition).toBe("PRESIDENT");
});

test("navegação principal funciona em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginPage(page);
  await page.getByRole("button", { name: /Abrir menu/ }).click();
  await expect(page.getByRole("link", { name: "Projetos", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Projetos", exact: true }).click();
  await expect(page).toHaveURL(/projetos/);
  expect(await page.locator("body").evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);
});
