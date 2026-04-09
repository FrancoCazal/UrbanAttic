FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings.production

EXPOSE ${PORT:-8000}

RUN DJANGO_SETTINGS_MODULE=config.settings.production \
    SECRET_KEY=build-only-dummy-key \
    DB_NAME=x DB_USER=x DB_PASSWORD=x DB_HOST=x \
    python manage.py collectstatic --noinput

CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
