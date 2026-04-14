FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    libpq-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 빌드 시 static 수집 (DB 불필요)
ENV DATABASE_URL=sqlite:///tmp/dummy.db
RUN python manage.py collectstatic --noinput
ENV DATABASE_URL=

EXPOSE 8000

CMD ["sh", "entrypoint.sh"]
