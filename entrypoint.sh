#!/bin/sh
set -e

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server on port ${PORT:-8000}..."
if [ "$DEBUG" = "True" ]; then
    exec python manage.py runserver 0.0.0.0:${PORT:-8000}
else
    exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
fi
