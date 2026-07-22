# Self-hosting

Use Node.js 22 e PostgreSQL 16. Configure as variáveis de `.env.example`, aplique `npx prisma migrate deploy`, execute o bootstrap inicial e inicie `npm run build && npm start`. Coloque TLS e um proxy reverso na frente da aplicação. Backups, rotação de segredo, entrega de e-mail e observabilidade são responsabilidade do operador.

O `compose.yaml` deste repositório serve apenas ao desenvolvimento local e não contém infraestrutura de produção.
