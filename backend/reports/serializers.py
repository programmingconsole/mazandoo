from rest_framework import serializers
from .models import WeatherReport, Vote, Comment
from users.serializers import UserSerializer
from locations.serializers import LocationSerializer

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'user', 'comment', 'created_at')

class WeatherReportSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    vote_score = serializers.IntegerField(read_only=True)
    user_vote = serializers.SerializerMethodField()
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = WeatherReport
        fields = (
            'id', 'user', 'location', 'weather_type', 'description', 
            'temperature', 'visibility', 'wind_condition', 'image', 
            'reporter_latitude', 'reporter_longitude', 'is_verified', 
            'vote_score', 'user_vote', 'comments_count', 'created_at'
        )

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return vote.vote_type
        return None

class WeatherReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherReport
        fields = (
            'location', 'weather_type', 'description', 'temperature', 
            'visibility', 'wind_condition', 'image', 'reporter_latitude', 
            'reporter_longitude'
        )
