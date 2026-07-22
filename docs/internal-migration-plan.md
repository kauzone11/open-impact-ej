# Plano interno de migração — Open Impact EJ

## Baseline verificada

- Destino original: `kauzone11/open-impact-ej` em `1ea4b209e5978b27bf997e26c940d1093fa05a99`.
- Fonte funcional: `kauzone11/atlas-impact` em `c82c2ab00d2c5dcb8493f205093f74fc98c65c75`.
- O checkout principal do destino continha diretórios não rastreados do usuário; a reconstrução ocorre neste worktree limpo e isolado.
- O destino antigo não publicou migrações Prisma e contém somente o protótipo de estudos de impacto. Não há contrato de dados de produção a preservar.

## Decisão de banco

Criar uma baseline PostgreSQL 16 única e coerente para o produto standalone. O schema final conterá somente contas globais, organizações, membros, diretorias, projetos, tarefas, agenda, reuniões, disponibilidade, finanças, convites, notificações, busca, preferências e auditoria. O caminho legado será validado a partir do schema original e documentará explicitamente que os registros de estudos não são importados, porque não possuem equivalente de gestão.

## Sequência de implementação

1. Portar do snapshot imutável do Atlas Hub apenas os serviços, componentes e regras correspondentes aos módulos obrigatórios.
2. Centralizar marca, ambiente, erros e primitives; trocar todas as URLs públicas e chamadas de API para rotas standalone.
3. Expor as rotas canônicas sem duplicar páginas e criar redirects de compatibilidade em `/hub/**`.
4. Preservar autenticação global, associação por organização, isolamento por tenant, concorrência otimista, auditoria e governança de Presidência/Diretorias.
5. Adaptar convites seguros, entrega por provedor, bootstrap inicial e seed demonstrativo.
6. Remover integralmente código, modelos, assets, dependências e documentação do produto antigo.
7. Criar testes unitários, de integração e Playwright, além do CI com PostgreSQL 16.
8. Validar instalação limpa e upgrade legado em bancos descartáveis; executar lint, tipos, testes, build, inspeção visual e buscas de integridade.
9. Publicar um único commit funcional em `origin/main`, atualizar About/topics e aguardar o CI verde, sem deploy.

## Limites

- Nenhum arquivo do checkout `atlas-impact` será alterado.
- Nenhuma configuração proprietária, domínio de produção, segredo ou infraestrutura de deploy será portada.
- Nenhum deploy será executado.
