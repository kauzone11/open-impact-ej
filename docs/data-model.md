# Modelo de dados

`HubAccount` representa a identidade global. `HubMember` representa a associação a uma `HubOrganization`; função técnica, posição organizacional e categoria são campos distintos. Diretorias, projetos, tarefas, reuniões, finanças, convites, notificações e auditorias carregam o tenant direta ou indiretamente.

Valores monetários são inteiros em centavos. Agregados mutáveis usam `version`. Respostas de reunião vivem separadas das fontes de convite, permitindo preservar a resposta quando uma das fontes é removida.
