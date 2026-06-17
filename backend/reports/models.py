from django.db import models
from django.conf import settings
from locations.models import Location
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum

class WeatherReport(models.Model):
    WEATHER_SUNNY = 'Sunny'
    WEATHER_CLOUDY = 'Cloudy'
    WEATHER_RAINY = 'Rainy'
    WEATHER_FOGGY = 'Foggy'
    WEATHER_WINDY = 'Windy'
    WEATHER_STORM = 'Storm'
    WEATHER_FLOODING = 'Flooding'
    WEATHER_SNOW = 'Snow'
    WEATHER_EXTREME_HEAT = 'Extreme Heat'

    WEATHER_CHOICES = [
        (WEATHER_SUNNY, 'Sunny'),
        (WEATHER_CLOUDY, 'Cloudy'),
        (WEATHER_RAINY, 'Rainy'),
        (WEATHER_FOGGY, 'Foggy'),
        (WEATHER_WINDY, 'Windy'),
        (WEATHER_STORM, 'Storm'),
        (WEATHER_FLOODING, 'Flooding'),
        (WEATHER_SNOW, 'Snow'),
        (WEATHER_EXTREME_HEAT, 'Extreme Heat'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weather_reports')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='weather_reports')
    
    weather_type = models.CharField(max_length=50, choices=WEATHER_CHOICES)
    description = models.TextField(blank=True, null=True)
    temperature = models.DecimalField(max_digits=5, decimal_places=2)  # Celsius
    visibility = models.CharField(max_length=50, default='Good')       # Good, Moderate, Poor
    wind_condition = models.CharField(max_length=50, default='Calm')   # Calm, Light, Moderate, Strong
    
    image = models.ImageField(upload_to='weather_photos/', null=True, blank=True)
    
    # Coordinates of user at the time of submission (to verify against location coordinates)
    reporter_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    reporter_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.weather_type} at {self.location.city} by {self.user.username} ({self.temperature}°C)"

    @property
    def vote_score(self):
        upvotes = self.votes.filter(vote_type=Vote.VOTE_UP).count()
        downvotes = self.votes.filter(vote_type=Vote.VOTE_DOWN).count()
        return upvotes - downvotes


class Vote(models.Model):
    VOTE_UP = 'UP'
    VOTE_DOWN = 'DOWN'
    
    VOTE_CHOICES = [
        (VOTE_UP, 'Upvote'),
        (VOTE_DOWN, 'Downvote'),
    ]

    report = models.ForeignKey(WeatherReport, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('report', 'user')


class Comment(models.Model):
    report = models.ForeignKey(WeatherReport, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.report.id}"


# Community Confidence Engine Helper
def calculate_location_confidence(location):
    """
    Calculates confidence scores for a location's current weather.
    Looks at reports from the last 6 hours.
    """
    time_threshold = timezone.now() - timedelta(hours=6)
    reports = WeatherReport.objects.filter(location=location, created_at__gte=time_threshold)
    
    if not reports.exists():
        return {
            "current_weather": "Unknown",
            "confidence_score": 0,
            "confidence_level": "None",
            "distribution": {},
            "report_count": 0
        }
    
    total_weight = 0.0
    weather_weights = {}
    reporters = set()
    
    for r in reports:
        reporters.add(r.user.id)
        # 1. Freshness factor: decays linearly from 1.0 (just submitted) to 0.1 (6 hours old)
        age = timezone.now() - r.created_at
        age_in_hours = age.total_seconds() / 3600.0
        freshness = max(0.1, 1.0 - (age_in_hours / 6.0))
        
        # 2. User Reputation factor: capped at 5.0 to avoid extreme outliers
        reputation_bonus = min(5.0, 1.0 + (r.user.reputation_score / 100.0))
        
        # 3. Photo factor: weights are 1.5x higher if there is an image uploaded
        photo_multiplier = 1.5 if r.image else 1.0
        
        weight = freshness * reputation_bonus * photo_multiplier
        
        weather_weights[r.weather_type] = weather_weights.get(r.weather_type, 0.0) + weight
        total_weight += weight

    if total_weight == 0:
        return {
            "current_weather": "Unknown",
            "confidence_score": 0,
            "confidence_level": "None",
            "distribution": {},
            "report_count": reports.count()
        }

    # Find weather type with maximum weight
    primary_weather = max(weather_weights, key=weather_weights.get)
    confidence_score = int((weather_weights[primary_weather] / total_weight) * 100)
    
    # Calculate percentage distributions
    distribution = {}
    for wtype, wweight in weather_weights.items():
        distribution[wtype] = int((wweight / total_weight) * 100)
        
    # Confidence Level based on unique reporters
    reporter_count = len(reporters)
    if reporter_count == 1:
        confidence_level = 'Low'
    elif reporter_count <= 4:
        confidence_level = 'Medium'
    else:
        confidence_level = 'High'
        
    return {
        "current_weather": primary_weather,
        "confidence_score": confidence_score,
        "confidence_level": confidence_level,
        "distribution": distribution,
        "report_count": reports.count()
    }
