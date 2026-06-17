from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeatherReportViewSet, ConfidenceView, TravelAdvisoryView

router = DefaultRouter()
router.register(r'reports', WeatherReportViewSet)

urlpatterns = [
    path('confidence/', ConfidenceView.as_view(), name='weather_confidence'),
    path('advisory/', TravelAdvisoryView.as_view(), name='travel_advisory'),
    path('', include(router.urls)),
]
