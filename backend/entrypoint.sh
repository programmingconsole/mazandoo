#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Waiting for database..."
until pg_isready -h db -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up - running migrations"
python manage.py makemigrations users locations reports notifications
python manage.py migrate

# Create initial default locations if they do not exist
echo "Populating initial database fixtures..."
python manage.py shell <<EOF
from locations.models import Location
if not Location.objects.exists():
    Location.objects.create(city="Cape Town", state="Western Cape", country="South Africa", latitude=-33.9249, longitude=18.4241)
    Location.objects.create(city="Nairobi", state="Nairobi County", country="Kenya", latitude=-1.2921, longitude=36.8219)
    Location.objects.create(city="Tokyo", state="Tokyo", country="Japan", latitude=35.6762, longitude=139.6503)
    Location.objects.create(city="Chamonix", state="Haute-Savoie", country="France", latitude=45.9227, longitude=6.8685)
    Location.objects.create(city="Grand Canyon", state="Arizona", country="USA", latitude=36.0544, longitude=-112.1401)
    print("Initial locations seeded.")
EOF

echo "Starting server..."
exec "$@"
