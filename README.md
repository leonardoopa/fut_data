# Passe — Mercado de jogadores

Estudo de caso SENAI/PE — CÓD. 237 Desenvolvedor I (Fullstack).

> README em construção: as seções exigidas pelo enunciado serão completadas ao longo do desenvolvimento.

## Pré-requisitos

- Docker 24+ com Docker Compose v2
- Python 3.12 (apenas para rodar o backend fora do Docker)

## Executar tudo com Docker (na raiz do repositório)

```bash
cp .env.example .env
docker compose up -d --build
```

- API: http://localhost:8000 (o prefixo `/api/v1` fica nas rotas)
- Documentação interativa (Swagger): http://localhost:8000/docs

As migrations rodam automaticamente na subida do backend.

## Executar o backend localmente

```bash
# Banco de dados (na raiz do repositório)
docker compose up -d db

# Backend (na pasta backend)
cd backend
cp .env.example .env
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --port 8000 --no-access-log
```

## Recriar o banco do zero (na pasta backend)

```bash
.venv/bin/alembic downgrade base
.venv/bin/alembic upgrade head
```

Com Docker, na raiz: `docker compose down -v && docker compose up -d --build`.

## Testes, lint e formatação (na pasta backend)

```bash
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```
