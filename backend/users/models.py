from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    LEVEL_EXPLORER = 'Explorer'
    LEVEL_REPORTER = 'Reporter'
    LEVEL_LOCAL_GUIDE = 'Local Guide'
    LEVEL_WEATHER_EXPERT = 'Weather Expert'
    LEVEL_TRUSTED_OBSERVER = 'Trusted Observer'

    LEVEL_CHOICES = [
        (LEVEL_EXPLORER, 'Explorer'),
        (LEVEL_REPORTER, 'Reporter'),
        (LEVEL_LOCAL_GUIDE, 'Local Guide'),
        (LEVEL_WEATHER_EXPERT, 'Weather Expert'),
        (LEVEL_TRUSTED_OBSERVER, 'Trusted Observer'),
    ]

    reputation_score = models.IntegerField(default=0)
    level = models.CharField(max_length=50, choices=LEVEL_CHOICES, default=LEVEL_EXPLORER)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def update_reputation(self, points):
        """Update reputation score and adjust level accordingly."""
        self.reputation_score += points
        # Level thresholds
        if self.reputation_score < 50:
            self.level = self.LEVEL_EXPLORER
        elif self.reputation_score < 150:
            self.level = self.LEVEL_REPORTER
        elif self.reputation_score < 500:
            self.level = self.LEVEL_LOCAL_GUIDE
        elif self.reputation_score < 1500:
            self.level = self.LEVEL_WEATHER_EXPERT
        else:
            self.level = self.LEVEL_TRUSTED_OBSERVER
        self.save()

    def __str__(self):
        return f"{self.username} ({self.level} - {self.reputation_score} pts)"
