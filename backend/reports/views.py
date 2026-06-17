from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from django.contrib.gis.geos import Point
from locations.models import Location
from .models import WeatherReport, Vote, Comment, calculate_location_confidence
from .serializers import WeatherReportSerializer, WeatherReportCreateSerializer, CommentSerializer

class WeatherReportViewSet(viewsets.ModelViewSet):
    queryset = WeatherReport.objects.all().order_by('-created_at')
    serializer_class = WeatherReportSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = WeatherReport.objects.all().order_by('-created_at')
        location_id = self.request.query_params.get('location', None)
        if location_id:
            queryset = queryset.filter(location_id=location_id)
            
        weather_type = self.request.query_params.get('weather_type', None)
        if weather_type:
            queryset = queryset.filter(weather_type=weather_type)
            
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = WeatherReportCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # GPS Location Verification
        location = serializer.validated_data['location']
        rep_lat = float(serializer.validated_data['reporter_latitude'])
        rep_lon = float(serializer.validated_data['reporter_longitude'])
        
        # User coordinates Point
        user_point = Point(rep_lon, rep_lat, srid=4326)
        
        # Calculate distance in meters using PostGIS
        # location.coords is geography Point, so distance is in meters
        distance_meters = location.coords.distance(user_point) * 100000.0  # approximate to meters if needed or use spatial distance
        
        # For precise geography distance in PostGIS:
        # Since we use geography=True, we can fetch distance directly:
        # Let's perform a database lookup to calculate the distance dynamically
        dist_query = Location.objects.annotate(
            dist=models.functions.Distance('coords', user_point)
        ).get(id=location.id)
        
        # dist_query.dist is a Distance object (which has .m representing meters)
        distance_meters = dist_query.dist.m
        
        allowed_radius = getattr(settings, 'WEATHER_REPORT_RADIUS_METERS', 2000)
        
        if distance_meters > allowed_radius:
            return Response({
                "error": "GPS verification failed. You must be physically present at the location to submit reports.",
                "distance_from_location_meters": int(distance_meters),
                "allowed_radius_meters": allowed_radius
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Create report
        report = serializer.save(user=request.user)
        
        # Reputation Engine trigger:
        # Valid Report: +5
        # Verified Photo: +10 (since photo is uploaded at submission)
        points_earned = 5
        if report.image:
            points_earned += 10
            
        request.user.update_reputation(points_earned)
        
        response_serializer = WeatherReportSerializer(report, context={'request': request})
        return Response({
            "message": "Weather report submitted successfully!",
            "points_earned": points_earned,
            "report": response_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        report = self.get_object()
        user = request.user
        vote_type = request.data.get('vote_type') # 'UP' or 'DOWN'
        
        if vote_type not in [Vote.VOTE_UP, Vote.VOTE_DOWN]:
            return Response({"error": "Invalid vote type. Use UP or DOWN."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if user has already voted
        existing_vote = Vote.objects.filter(report=report, user=user).first()
        reporter = report.user
        
        if existing_vote:
            if existing_vote.vote_type == vote_type:
                # Toggle/Remove vote
                existing_vote.delete()
                # Subtract points previously earned
                pts = -2 if vote_type == Vote.VOTE_UP else 0
                reporter.update_reputation(pts)
                return Response({"status": "vote_removed", "vote_score": report.vote_score})
            else:
                # Change vote type
                old_vote_type = existing_vote.vote_type
                existing_vote.vote_type = vote_type
                existing_vote.save()
                
                # Adjust points: Upvote is +2, downvote has no reputation point penalty in spec (only Upvote is +2)
                # So if changing from UP to DOWN: reporter loses 2 points.
                # If changing from DOWN to UP: reporter gains 2 points.
                if old_vote_type == Vote.VOTE_UP and vote_type == Vote.VOTE_DOWN:
                    reporter.update_reputation(-2)
                elif old_vote_type == Vote.VOTE_DOWN and vote_type == Vote.VOTE_UP:
                    reporter.update_reputation(2)
                    
                return Response({"status": "vote_changed", "vote_score": report.vote_score})
        else:
            # Create new vote
            Vote.objects.create(report=report, user=user, vote_type=vote_type)
            if vote_type == Vote.VOTE_UP:
                reporter.update_reputation(2) # Upvote: +2
            return Response({"status": "vote_registered", "vote_score": report.vote_score})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        report = self.get_object()
        comment_text = request.data.get('comment')
        if not comment_text:
            return Response({"error": "Comment text is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        comment = Comment.objects.create(report=report, user=request.user, comment=comment_text)
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        report = self.get_object()
        comments = report.comments.all().order_by('-created_at')
        return Response(CommentSerializer(comments, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def verify(self, request, pk=None):
        report = self.get_object()
        if report.is_verified:
            return Response({"message": "Report is already verified."}, status=status.HTTP_400_BAD_REQUEST)
            
        report.is_verified = True
        report.save()
        
        # Report Confirmed: +5 points
        report.user.update_reputation(5)
        return Response({"status": "verified", "message": "Report verified successfully. Reporter awarded +5 reputation points."})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def flag_fake(self, request, pk=None):
        report = self.get_object()
        reporter = report.user
        
        # Fake Report: -10 points
        reporter.update_reputation(-10)
        report.delete()
        
        return Response({"status": "deleted", "message": "Fake report removed. Reporter penalized -10 reputation points."})


class ConfidenceView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        location_id = request.query_params.get('location')
        if not location_id:
            return Response({"error": "location parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            location = Location.objects.get(id=location_id)
        except Location.DoesNotExist:
            return Response({"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND)
            
        confidence_data = calculate_location_confidence(location)
        return Response(confidence_data)


class TravelAdvisoryView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        location_id = request.query_params.get('location')
        if not location_id:
            return Response({"error": "location parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            location = Location.objects.get(id=location_id)
        except Location.DoesNotExist:
            return Response({"error": "Location not found"}, status=status.HTTP_404_NOT_FOUND)
            
        conf = calculate_location_confidence(location)
        weather = conf['current_weather']
        score = conf['confidence_score']
        level = conf['confidence_level']
        
        advisory_level = "Normal"
        advisory_message = "No travel advisories. Weather is calm."
        
        if weather in [WeatherReport.WEATHER_FLOODING, WeatherReport.WEATHER_STORM]:
            if level in ['Medium', 'High']:
                advisory_level = "Danger"
                advisory_message = f"CRITICAL ADVISORY: Hyperlocal reports confirm {weather} conditions. Travel is highly discouraged."
            else:
                advisory_level = "Warning"
                advisory_message = f"WARNING: Recent single reports suggest {weather}. Exercise extreme caution."
        elif weather == WeatherReport.WEATHER_EXTREME_HEAT:
            advisory_level = "Advisory"
            advisory_message = "HEAT ADVISORY: Extreme temperatures reported. Hydrate and avoid direct sun exposure."
        elif weather in [WeatherReport.WEATHER_FOGGY, WeatherReport.WEATHER_SNOW]:
            advisory_level = "Advisory"
            advisory_message = f"ROAD ADVISORY: Poor road visibility expected due to {weather}. Drive slowly."
            
        return Response({
            "location": location.city,
            "current_weather": weather,
            "confidence_score": score,
            "confidence_level": level,
            "advisory_level": advisory_level,
            "advisory_message": advisory_message,
            "report_count": conf['report_count']
        })
