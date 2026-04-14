#!/bin/sh
set -e

echo "Waiting for database..."
while ! python -c "
import MySQLdb
MySQLdb.connect(host='$DB_HOST', port=int('$DB_PORT'), user='$DB_USER', passwd='$DB_PASSWORD', db='$DB_NAME')
" 2>/dev/null; do
  sleep 1
done
echo "Database ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@citizen.co.kr', 'admin1234')
    print('Superuser created: admin / admin1234')
else:
    print('Superuser already exists')
"

echo "Starting dev server..."
exec python manage.py runserver 0.0.0.0:8000
