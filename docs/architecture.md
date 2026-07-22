# Arquitetura

O App Router expõe páginas e Route Handlers. Páginas cliente consomem DTOs mínimos; autenticação, tenant e autorização são resolvidos no servidor. Serviços recebem o contexto autenticado e sempre combinam o identificador do recurso com `organizationId`. Prisma concentra persistência e transações serializáveis; PostgreSQL aplica chaves, índices e invariantes de governança.

Rotas canônicas não têm o prefixo `/hub`. O prefixo antigo existe somente como redirect de compatibilidade, sem páginas duplicadas.
