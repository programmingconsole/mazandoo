from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from .models import Location
from .serializers import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Location.objects.all()
        q = self.request.query_params.get('q', None)
        if q:
            queryset = queryset.filter(
                Q(city__icontains=q) | 
                Q(state__icontains=q) | 
                Q(country__icontains=q)
            )

        # Nearest locations query (by lat/lon)
        lat = self.request.query_params.get('lat', None)
        lon = self.request.query_params.get('lon', None)
        if lat and lon:
            try:
                user_point = Point(float(lon), float(lat), srid=4326)
                # Annotate distance and sort by it
                queryset = queryset.annotate(
                    distance=Distance('coords', user_point)
                ).order_by('distance')
            except ValueError:
                pass
                
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        location = self.get_object()
        user = request.user
        if location.followed_by.filter(id=user.id).exists():
            location.followed_by.remove(user)
            return Response({"status": "unfollowed", "is_followed": False}, status=status.HTTP_200_OK)
        else:
            location.followed_by.add(user)
            return Response({"status": "followed", "is_followed": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def followed(self, request):
        user = request.user
        locations = user.followed_locations.all()
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)
