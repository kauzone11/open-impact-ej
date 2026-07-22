# Migração do Open Impact legado

## Decisão

O repositório anterior não possuía migrações Prisma publicadas nem contrato de dados de produção. Seu schema era um protótipo exclusivamente voltado a eventos e cálculos, sem organizações ou contas compatíveis com a plataforma de gestão. Por isso, a versão 1.0 adota uma baseline standalone limpa.

Registros do protótipo anterior não são importados: não existe correspondência segura com diretorias, membros, projetos ou finanças. Antes de atualizar um ambiente que tenha usado `prisma db push`, faça backup e exporte os registros que precisem ser arquivados. A validação legada cria o schema anterior, insere registros representativos, arquiva a contagem e substitui somente esse banco descartável pela baseline final.

Novas instalações executam apenas `20260722000000_open_impact_ej_baseline`.
