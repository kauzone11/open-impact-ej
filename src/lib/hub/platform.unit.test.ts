import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseEnv } from "@/lib/env";
import { parseMoneyToCents } from "@/lib/money";
import { effectiveMemberLabel } from "./member-label";
import { normalizeHubEmail } from "./member-management";
import { isValidHubOrganizationSlug, normalizeHubOrganizationSlug } from "./organization";
import { canAccessHubSettings } from "./settings-policy";
import { generateHubTemporaryPassword, validateHubPassword } from "./security";
import { generateHubInvitationToken, hashHubInvitationToken, invitationTokenHashesMatch } from "./invitation-token";

const passwordCases: Array<[string, boolean]> = [
  ["curta1A", false], ["semmaiuscula1", false], ["SEMMINUSCULA1", false], ["SemNumero", false],
  ["OpenImpact1", false], ["SenhaForte1", true], [generateHubTemporaryPassword(), true], ["OutraSenha2026", true],
];
for (const [password, valid] of passwordCases) test(`senha ${valid ? "aceita" : "rejeita"}: ${password.slice(0, 5)}`, () => assert.equal(validateHubPassword(password) === null, valid));

for (const [input, expected] of [[" A@EXAMPLE.COM ", "a@example.com"], ["pessoa@ej.org", "pessoa@ej.org"], ["MISTA@Ej.Com", "mista@ej.com"], [" nome+tag@ej.org ", "nome+tag@ej.org"]]) {
  test(`normaliza e-mail ${input}`, () => assert.equal(normalizeHubEmail(input), expected));
}

for (const [input, expected] of [["EJ Exemplo", "ej-exemplo"], ["  Projetos  ", "projetos"], ["Gestão & Pessoas", "gestao-pessoas"], ["Financeiro_2026", "financeiro-2026"]]) {
  test(`normaliza slug ${input}`, () => { const slug = normalizeHubOrganizationSlug(input); assert.equal(slug, expected); assert.equal(isValidHubOrganizationSlug(slug), true); });
}

for (const [role, position, allowed] of [["SUPER_ADMIN", "MEMBER", true], ["MEMBER", "PRESIDENT", true], ["VIEWER", "COUNSELOR", true], ["DIRECTOR", "MEMBER", false], ["ADMIN", "MEMBER", false], ["MEMBER", "MEMBER", false]] as const) {
  test(`acesso a ajustes ${role}/${position}`, () => assert.equal(canAccessHubSettings(role, position), allowed));
}

test("token de convite tem entropia e formato base64url", () => assert.match(generateHubInvitationToken(), /^[A-Za-z0-9_-]{43}$/));
test("tokens de convite são únicos", () => assert.notEqual(generateHubInvitationToken(), generateHubInvitationToken()));
test("hash do convite é SHA-256", () => assert.match(hashHubInvitationToken("token"), /^[a-f0-9]{64}$/));
test("hash equivalente é reconhecido", () => { const hash = hashHubInvitationToken("token"); assert.equal(invitationTokenHashesMatch(hash, hash), true); });
test("hash diferente é rejeitado", () => assert.equal(invitationTokenHashesMatch(hashHubInvitationToken("a"), hashHubInvitationToken("b")), false));

for (const [position, director, label] of [["PRESIDENT", true, "Presidente"], ["COUNSELOR", true, "Conselheiro"], ["MEMBER", true, "Diretor(a)"], ["MEMBER", false, "Membro"]] as const) {
  test(`rótulo efetivo ${position}/${director}`, () => assert.equal(effectiveMemberLabel({ organizationPosition: position, isDirector: director }), label));
}

for (const [input, expected] of [["1.234,56", 123456], ["0,01", 1], ["10", 1000], [" 19,999 ", 2000]] as const) test(`converte BRL ${input}`, () => assert.equal(parseMoneyToCents(input), expected));
test("rejeita valor financeiro negativo", () => assert.throws(() => parseMoneyToCents("-1,00")));

const validEnv: NodeJS.ProcessEnv = { DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test", AUTH_SECRET: "a".repeat(32), APP_URL: "http://localhost:3000", NEXT_PUBLIC_APP_URL: "http://localhost:3000", NODE_ENV: "test" };
test("ambiente aceita configuração mínima", () => assert.equal(parseEnv(validEnv).INVITATION_TTL_HOURS, 72));
test("ambiente rejeita segredo curto", () => assert.throws(() => parseEnv({ ...validEnv, AUTH_SECRET: "short" })));
test("ambiente rejeita URL inválida", () => assert.throws(() => parseEnv({ ...validEnv, APP_URL: "x" })));
test("ambiente limita TTL", () => assert.throws(() => parseEnv({ ...validEnv, INVITATION_TTL_HOURS: "721" })));

function textFiles(root: string): string[] { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? textFiles(join(root, entry.name)) : /\.(ts|tsx|css|md|json|prisma|sql|yml|yaml)$/.test(entry.name) ? [join(root, entry.name)] : []); }
const sources = ["src", "prisma", "scripts", "docs", ".github"].flatMap((root) => textFiles(root)).concat(["README.md", "package.json"]).filter((file) => !file.includes(".test.")).map((file) => ({ file, text: readFileSync(file, "utf8") }));
for (const [name, pattern] of [
  ["sem diálogos nativos", /window\.(alert|prompt|confirm)|\b(?:alert|prompt|confirm)\(/],
  ["sem domínio proprietário", /atlas\.ouseagency\.com|ouseagency\.com/],
  ["sem rota antiga de análise", /\/studies|\/study/],
  ["sem modelo antigo de análise", /model\s+(?:Study|EventImpact|Methodology)/],
  ["sem marca pública anterior", /Atlas Impact/],
  ["sem segredo literal", /AUTH_SECRET\s*=\s*['\"][^'\"]+['\"]/],
  ["sem token bruto em auditoria", /metadata[^\n]+(?:rawToken|tokenHash)/],
  ["README não promete captura inexistente", /!\[[^\]]*\]\([^)]*(?:screenshot|captura)/i],
] as const) test(name, () => { const matches = sources.filter((item) => pattern.test(item.text)); assert.deepEqual(matches.map((item) => item.file), []); });
