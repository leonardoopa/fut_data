# Passe — Mercado de jogadores

Estudo de caso SENAI/PE — CÓD. 237 Desenvolvedor I (Fullstack).

> README em construção: as seções exigidas pelo enunciado serão completadas ao longo do desenvolvimento.

Todos os comandos abaixo rodam na raiz do repositório.

## Pré-requisitos

- Docker 24+ com Docker Compose v2
- Python 3.12 (apenas para rodar o backend fora do Docker)

## Configuração

Um único arquivo `.env` na raiz serve ao Docker Compose e ao backend:

```bash
cp .env.example .env
```

## Executar tudo com Docker

```bash
docker compose up -d --build
```

- API: http://localhost:8000 (o prefixo `/api/v1` fica nas rotas)
- Documentação interativa (Swagger): http://localhost:8000/docs

As migrations do Django rodam automaticamente na subida do backend.

## Executar o backend sem Docker

Um único `requirements.txt` na raiz instala a API, os testes e o lint.

```bash
docker compose up -d db
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python backend/manage.py migrate
.venv/bin/uvicorn app.asgi:app --app-dir backend --port 8000 --no-access-log
```

## Recriar o banco do zero

Com Docker:

```bash
docker compose exec backend python manage.py migrate league zero
docker compose exec backend python manage.py migrate
```

Sem Docker:

```bash
.venv/bin/python backend/manage.py migrate league zero
.venv/bin/python backend/manage.py migrate
```

## Testes, lint e formatação

Com Docker:

```bash
docker compose exec backend pytest
docker compose exec backend ruff check .
docker compose exec backend ruff format --check .
```

Sem Docker:

```bash
.venv/bin/pytest backend
.venv/bin/ruff check backend
.venv/bin/ruff format --check backend
```
