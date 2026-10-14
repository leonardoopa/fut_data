FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_ROOT_USER_ACTION=ignore \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /srv/backend

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && uvicorn app.asgi:app --host 0.0.0.0 --port 8000 --no-access-log"]
