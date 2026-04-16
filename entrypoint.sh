#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser..."
python manage.py shell <<PYEOF
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@citizen.co.kr', 'admin1234')
    print('Superuser created: admin / admin1234')
else:
    print('Superuser already exists')
PYEOF

echo "Starting server on port ${PORT:-8000}..."
if [ "$DEBUG" = "True" ]; then
    exec python manage.py runserver 0.0.0.0:${PORT:-8000}
else
    exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
fi
