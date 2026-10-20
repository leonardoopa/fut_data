# Passe — Mercado de jogadores

Estudo de caso SENAI/PE — CÓD. 237 Desenvolvedor I (Fullstack). Aplicação web do mercado de jogadores de uma liga fictícia: jogadores, clubes, compra e venda com contrato de fidelidade, histórico de transações, escalação, partidas e classificação.

Todos os comandos deste README rodam na raiz do repositório.

## 1. Pré-requisitos

- Docker Engine 24 ou superior, com Docker Compose v2 (sobe o banco, a API e a interface)
- Node.js 22 LTS, com npm 10 (testes, lint e formatação do frontend)
- Python 3.12, com pip (apenas para rodar o backend fora do Docker, opcional)

O MySQL 8.4 roda no Docker, pela imagem pública `mysql:8.4`; não é preciso instalá-lo.

## 2. Banco de dados

O banco é criado vazio pelas migrations do Django, que rodam automaticamente quando o backend sobe (seção 3). Para apagar todas as tabelas e criá-las de novo, com a aplicação no ar:

```bash
docker compose exec backend python manage.py migrate league zero
docker compose exec backend python manage.py migrate
```

O primeiro comando desfaz todas as migrations (apaga as tabelas) e o segundo cria as tabelas de novo, vazias. Não há carga de dados de exemplo.

## 3. Instalar e executar (Ubuntu 24.04 com Docker)

```bash
cp .env.example .env
docker compose up -d --build
```

Esse único comando sobe o MySQL, a API e a interface. As migrations rodam na subida da API.

- Origem da API: http://localhost:8000 (as rotas ficam em `/api/v1`)
- Interface: http://localhost:5173
- Documentação interativa (Swagger): http://localhost:8000/docs

Arquivos de trava de dependências versionados: `requirements.txt` (backend) e `frontend/package-lock.json` (frontend).

### Backend sem Docker (opcional)

Com o banco no ar (`docker compose up -d db`):

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python backend/manage.py migrate
.venv/bin/uvicorn app.asgi:app --app-dir backend --port 8000 --no-access-log
```

Para recriar o banco nesse modo: `.venv/bin/python backend/manage.py migrate league zero` e depois `.venv/bin/python backend/manage.py migrate`.

### Frontend sem Docker (opcional)

Com a API no ar:

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

A interface abre em http://localhost:5173 e usa a API de `VITE_API_URL`.

## 4. Variáveis de ambiente

Um único arquivo `.env` na raiz serve ao Docker Compose, ao backend e ao frontend. O modelo é o `.env.example`.

| Variável | Uso | Valor do exemplo |
| --- | --- | --- |
| `MYSQL_HOST` | Host do MySQL para o backend fora do Docker (no Docker, o Compose usa `db`) | `localhost` |
| `MYSQL_PORT` | Porta do MySQL publicada no host | `3306` |
| `MYSQL_DATABASE` | Nome do banco | `passe` |
| `MYSQL_USER` | Usuário do banco usado pela API | `passe` |
| `MYSQL_PASSWORD` | Senha desse usuário (obrigatória) | `passe` |
| `MYSQL_ROOT_PASSWORD` | Senha do root do MySQL no container (obrigatória) | `root` |
| `API_PORT` | Porta publicada da API | `8000` |
| `CORS_ORIGINS` | Origens liberadas no CORS, separadas por vírgula | `http://localhost:5173` |
| `LOG_LEVEL` | Nível de log da API | `INFO` |
| `VITE_API_URL` | Endereço da API usado pela interface (lido no build) | `http://localhost:8000/api/v1` |
| `FRONTEND_PORT` | Porta publicada da interface | `5173` |

## 5. Estrutura de pastas e bibliotecas

```
backend/
  app/
    controllers/    rotas da API (FastAPI), finas: validam a entrada e chamam um serviço
    services/       casos de uso, com as transações do banco
    repositories/   todas as consultas ao banco (Django ORM)
    domain/         regras de negócio puras (cálculos, validações e catálogo de exceções)
    dtos/           dados de entrada que os serviços recebem
    requests/       modelos Pydantic de corpo e query params, com a validação estrita
    views/          formatação das respostas (JSON e CSV)
    models/         models do Django ORM, com os nomes de tabelas e colunas do enunciado
    migrations/     migrations do Django
    core/           tratamento central de erros, log de requisições, conexão e relógio
  config/           settings do Django (aplicação e testes)
  tests/            testes por camada (domain, requests, dtos, models e api)
frontend/
  src/
    api/            cliente HTTP e chamadas à API (única camada que acessa a API)
    hooks/          estado das telas: carregamento, erro, ações e recarga dos dados
    components/     componentes reutilizáveis (tabela, paginação, formulário, mensagens, diálogos)
    pages/          telas de jogadores, clubes, partidas e classificação
    config/         tabela das formações
    format/         moeda, datas no horário de Brasília e rótulos
    validation/     regras de validação dos formulários
```

### Bibliotecas do backend

| Biblioteca | Motivo |
| --- | --- |
| FastAPI | Framework da API REST, com validação pelo Pydantic e documentação Swagger |
| Uvicorn | Servidor ASGI que executa a API |
| Django | ORM e migrations do banco de dados (o FastAPI atende o HTTP) |
| PyMySQL | Driver do MySQL em Python puro, sem bibliotecas nativas para instalar |
| cryptography | Autenticação `caching_sha2_password` do MySQL 8 pelo PyMySQL |
| python-dotenv | Leitura do `.env` da raiz pelas settings |
| pytest e pytest-django | Testes automatizados, com o banco de teste do Django |
| httpx2 | Cliente HTTP do `TestClient` usado nos testes da API |
| Ruff | Lint e formatação do backend |
| pre-commit | Verificações automáticas antes de cada commit |

### Bibliotecas do frontend

| Biblioteca | Motivo |
| --- | --- |
| React Router (`react-router-dom`, modo biblioteca) | Rotas e navegação entre as telas |
| React Hook Form | Estado dos formulários e erros por campo |
| Zod | Regras de validação e mensagens dos formulários, declaradas uma vez |
| `@hookform/resolvers` | Liga as regras do Zod ao React Hook Form |
| Vitest e jsdom | Testes de componente com o executor do Vite e um navegador simulado |
| Testing Library (`react`, `dom`, `user-event`, `jest-dom`) | Testes que interagem com a tela como o usuário |
| ESLint (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`) | Lint do TypeScript e dos hooks do React |
| Prettier e `eslint-config-prettier` | Formatação, sem conflito com o ESLint |
| TypeScript, Vite, `@vitejs/plugin-react`, `@types/*` | Base do projeto criado com o template oficial `react-ts` do Vite |

## Diferenciais e como executá-los

Com a aplicação no ar pelo Docker (seção 3):

| Diferencial | Como executar |
| --- | --- |
| Testes do backend | `docker compose exec backend pytest` |
| Lint do backend | `docker compose exec backend ruff check .` |
| Verificação da formatação do backend | `docker compose exec backend ruff format --check .` |
| Docker e Docker Compose | `docker compose up -d --build` sobe interface, API e banco |
| Documentação interativa | http://localhost:8000/docs |
| Logs de cada requisição | `docker compose logs backend` (uma linha por requisição, com data e hora, método, caminho e status) |
| Testes do frontend | `npm --prefix frontend ci` e depois `npm --prefix frontend test` |
| Lint do frontend | `npm --prefix frontend run lint` |
| Verificação da formatação do frontend | `npm --prefix frontend run format:check` |
| Responsividade | Telas utilizáveis com 375 px de largura; as tabelas rolam dentro do próprio quadro |

Os comandos de formatação acima só verificam, sem alterar arquivos. Os testes do backend usam SQLite em memória, como o enunciado permite, e terminam sozinhos.

Fora do Docker, os mesmos comandos do backend são `.venv/bin/pytest backend`, `.venv/bin/ruff check backend` e `.venv/bin/ruff format --check backend`. Os hooks do pre-commit (Ruff, espaços no fim da linha, fim de arquivo, YAML, TOML e marcadores de conflito) são ativados com `.venv/bin/pre-commit install`.

## 6. Decisões e premissas

- **Arquitetura do backend:** FastAPI para o HTTP e Django apenas como ORM e migrations, numa organização MVC com camadas de serviço e de repositório. Os endpoints são síncronos, e cada um recicla a conexão do Django na thread em que roda (`DatabaseRouter`), como o Django faz a cada requisição.
- **Erros:** todo erro esperado é uma classe do catálogo `backend/app/domain/exceptions.py`. A categoria define o código HTTP (400, 404 ou 409) num único tratador. A ordem das conferências é: formato do pedido (400), recursos inexistentes (404), regras do pedido que dependem do momento (400) e regras do estado atual (409).
- **Corpo sem `Content-Type`:** é lido como JSON mesmo assim.
- **Unicidade do nome do clube (RN10):** a coluna `nome_normalizado` guarda o nome depois da V4, em minúsculas e com os acentos, com collation binária e índice único.
- **Sigla:** a primeira letra precisa ser a primeira letra do nome; um hífen ou ponto no início do nome é ignorado.
- **Listagem de jogadores:** o banco filtra posição, condição, clube e idade. A busca, a faixa de valor de mercado, a ordenação e a paginação rodam na aplicação, porque o valor de mercado é calculado e a comparação sem acentos do enunciado (NFD) não é reproduzida pelas collations do banco. Numa faixa com um só limite, o outro assume o extremo (idade 16 a 45, valor 0 a 550).
- **Condição atual reenviada:** responde 200 e não grava nada.
- **Fidelidade:** aceita quando é estritamente posterior ao momento da compra e no máximo 1.095 dias depois dele. O momento da compra é lido uma vez e vale para o início do contrato, a transação e essa conferência.
- **Concorrência:** compra, venda, edição, alteração de condição, exclusão, escalação e partida rodam numa transação, com bloqueio das linhas envolvidas (jogadores em ordem crescente de id e depois os clubes). Dois cadastros de clube simultâneos com o mesmo nome ou sigla são barrados pelo índice único (409). O limite de 20 clubes é conferido por contagem antes da inserção.
- **Resultado da partida:** não é coluna; é calculado a partir do placar gravado, com a mesma regra usada pelo motor da partida e pela classificação.
- **Mesmo erro nos dois clubes da partida:** a mensagem cita o mandante.
- **CSV:** enviado com `Content-Disposition: attachment; filename="transacoes-clube-{id}.csv"`.
- **Valores em moedas:** as respostas trazem números JSON; a interface mostra 2 casas com vírgula, sem símbolo de moeda (a unidade do enunciado é "moedas").
- **Interface:** as recusas previsíveis ("só livres" com clube, de DOENTE direto para APTO e mudança de posição de jogador com clube) são impedidas na tela, com o motivo; as demais são enviadas e o `message` da API é mostrado. A compra não tem etapa extra de confirmação: o botão "Confirmar compra" do formulário é a confirmação. O detalhe de uma partida fica em `/matches/{id}`.

## 7. Funcionalidades não implementadas

Nenhuma.

## Como o projeto foi feito

Atuei como arquiteto e revisor do projeto e escrevi à mão boa parte do código. Usei agentes de IA como apoio na implementação e como equipe de teste. As decisões, a revisão e o aceite de cada entrega foram meus.

- **Arquitetura e stack definidas por mim:**
  - FastAPI para o HTTP, Django ORM para models e migrations, MySQL 8.4 e React com TypeScript e Vite.
  - Backend em camadas: controllers finos, serviços com as transações, repositórios com todo o acesso ao banco e um domínio puro, sem framework.
  - DTOs num pacote próprio e um catálogo único de exceções.
  - Configuração num só `.env` e num só `requirements.txt`, lidos com `os.getenv`.
  - Ruff, ESLint, Prettier e pre-commit como portões de qualidade.
- **Ciclo de cada tarefa:**
  - Quebrei o enunciado nas 43 tarefas do planejamento abaixo.
  - Para cada uma, passei ao agente uma especificação fechada: a regra de negócio, o item do barema e o critério de aceite.
  - Antes do commit, eu revisava o diff, rodava os testes e o lint e usava a tela ou a API.
  - Nada entrou no repositório sem essa revisão, e todos os commits são meus.
- **Orquestração de agentes com o Orca:** nas partes grandes, rodei vários agentes do Claude Code em paralelo, cada um no seu próprio worktree e com escopo delimitado. As frentes foram:
  - a construção do frontend a partir do mockup do Figma: componentes compartilhados, hooks de dados e telas;
  - os testes unitários do domínio, baseados nas tabelas de exemplo do enunciado;
  - os testes de integração da API, com os casos de 400, 404 e 409 de cada item do roteiro.
- **Validação independente por agentes:** com tudo pronto, outros agentes testaram a aplicação como a banca faria, sem acesso ao contexto de quem escreveu o código.
  - Subiram o projeto do zero só com os comandos deste README.
  - Rodaram o roteiro da API contra o banco vazio.
  - Percorreram as telas num navegador automatizado (Playwright), em 1366 × 768 e em 375 px, com a rede lenta e com o backend parado.
  - Cada falha encontrada virou uma tarefa de correção com teste. Eu conferi cada achado antes de aceitar a correção.

## 8. Uso de inteligência artificial

- **Ferramentas:**
  - Claude Code (Anthropic), como assistente de código e de revisão.
  - Orca, para orquestrar vários agentes do Claude Code em paralelo.
  - Playwright, dirigido pelos agentes, para os testes de ponta a ponta no navegador.
- **Onde:**
  - Backend: implementação das camadas na arquitetura que defini (`backend/app`) e os testes unitários e de integração (`backend/tests`).
  - Frontend: telas a partir do mockup, componentes, hooks de dados e testes de componente (`frontend/src`).
  - Docker, configuração de lint e pre-commit, e revisão deste README.
  - Validação: ensaio da preparação da banca, roteiro da API e roteiro da interface.
- **Como e por quê:**
  - Boa parte do código foi escrita por mim, à mão. Usei a IA para ganhar velocidade e para ter uma segunda verificação, sistemática, de cada regra do enunciado.
  - O controle de qualidade ficou comigo. As especificações vieram do enunciado e do barema, os testes travam cada regra e o lint e a verificação da formatação passam antes de cada entrega.
  - Os agentes de validação trabalharam de forma independente dos que implementaram.
- **Aceito:**
  - As regras de negócio, cobertas por testes baseados nas tabelas do enunciado.
  - A validação estrita das entradas.
  - As telas que seguem o mockup.
  - As correções apontadas pelas auditorias: responsividade em 375 px, estados de carregamento e erro ao voltar a uma tela e mensagens com vírgula decimal.
- **Alterado por decisão minha:**
  - A troca de SQLAlchemy e Alembic pelo Django ORM.
  - O padrão MVC com DTOs num pacote próprio e o catálogo único de exceções.
  - Um só `requirements.txt` e um só `.env` na raiz, lidos com `os.getenv`.
  - O pre-commit só com o Ruff.
  - A lista de clubes do menu lateral mantida quando a API cai, para a página de cada clube continuar acessível e mostrar o próprio erro.
- **Descartado:**
  - A primeira versão do backend, com SQLAlchemy e Alembic.
  - A classe de configuração com `pydantic-settings`.
  - Os hooks de black, flake8 e autoflake, que conflitavam com o Ruff.
  - O bloqueio na tela de faixas de idade e de valor invertidas: a API já recusa, e a tela mostra o `message`.
  - Travar os titulares dentro da partida, porque inverteria a ordem dos locks e criaria risco de deadlock com a venda.

## Planejamento das tarefas

Prazo de entrega: 23/10/2026, às 20h (horário de Brasília). Cada tarefa vira um ou mais commits.

### Backend (FastAPI + Django ORM + MySQL)

- [x] 1. Estrutura do projeto, Ruff, pytest e pre-commit
- [x] 2. Configuração do Django ORM e do MySQL por variáveis de ambiente
- [x] 3. Models e migration das 7 tabelas, com chaves e restrições
- [x] 4. Tratamento de erros centralizado (JSON com `message`), CORS, 404 e 405
- [x] 5. Log de cada requisição (data e hora, método, caminho e status)
- [x] 6. Validação estrita do corpo e dos campos (V1, V2, V4 e V5)
- [x] 7. Validação dos ids da URL, dos query params e das datas (V8 e RN01)
- [x] 8. Overall, valor base e valor de mercado (RN02 a RN06)
- [x] 9. Taxa de compra, multa por fidelidade e comissão de venda (RN13, RN15 e RN16)
- [x] 10. Ordem alfabética e busca sem acentos (RN07)
- [x] 11. Cadastro e consulta de jogadores (`POST /players`, `GET /players/{id}`)
- [x] 12. Edição e alteração de condição (`PUT /players/{id}`, `PATCH /players/{id}/condition`)
- [x] 13. Exclusão lógica de jogadores (`DELETE /players/{id}`, RN09)
- [x] 14. Listagem com busca, filtros, ordenação e paginação (`GET /players`, RN07)
- [x] 15. Clubes: criação, listagem ordenável e consulta com elenco (RN10 e RN11)
- [x] 16. Compra de jogadores com contrato de fidelidade (RN12 a RN14)
- [x] 17. Venda de jogadores com multa e comissão (RN15 e RN16)
- [x] 18. Histórico de transações com totais (`summary`, RN17)
- [x] 19. Exportação do histórico em CSV (RN18)
- [x] 20. Escalação dos titulares (RN19)
- [x] 21. Motor da partida: duelos e placar (RN20)
- [x] 22. Partidas, histórico de partidas e classificação (RN20 e RN21)
- [x] 23. Testes de API dos casos-limite de cada item do roteiro (400, 404 e 409)
- [x] 24. Revisão da documentação interativa (Swagger) com exemplos

### Frontend (React + Vite)

- [x] 25. Projeto Vite com React e TypeScript, ESLint, Prettier e Vitest
- [x] 26. Cliente da API, formatação de moeda e de datas (horário de Brasília), carregamento e erros
- [x] 27. Layout, navegação e componentes reutilizáveis (tabela, paginação, confirmação, formulários)
- [x] 28. Jogadores: tabela, paginação, busca, filtros e ordenação
- [x] 29. Jogadores: cadastro, edição, alteração de condição e exclusão
- [x] 30. Clubes: listagem ordenável e criação
- [x] 31. Página do clube: caixa, valor do elenco, patrimônio e elenco com contratos
- [x] 32. Compra a partir dos jogadores livres, com o resultado da operação
- [x] 33. Venda com confirmação, com o resultado da operação
- [x] 34. Histórico de transações: filtros, totais e exportação em CSV
- [x] 35. Escalação na página do clube
- [x] 36. Partidas: jogar, ver os duelos e consultar o histórico de partidas
- [x] 37. Classificação
- [x] 38. Responsividade em 375 px nas telas de jogadores, clube e histórico
- [x] 39. Testes de componente no frontend

### Entrega

- [x] 40. Frontend no Docker Compose: um único comando sobe interface, API e banco
- [x] 41. README completo: bibliotecas e motivos, decisões e premissas, funcionalidades não implementadas e uso de IA
