from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.conf import settings

class Location(models.Model):
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100)
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # PostGIS spatial point field (geography=True measures distance in meters)
    coords = gis_models.PointField(geography=True, blank=True, null=True)
    
    followed_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='followed_locations',
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.coords = Point(float(self.longitude), float(self.latitude))
        super().save(*args, **kwargs)

    def __str__(self):
        state_str = f", {self.state}" if self.state else ""
        return f"{self.city}{state_str}, {self.country}"
