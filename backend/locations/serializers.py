from rest_framework import serializers
from .models import Location

class LocationSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField(source='followed_by.count', read_only=True)
    is_followed = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ('id', 'city', 'state', 'country', 'latitude', 'longitude', 'followers_count', 'is_followed', 'created_at')

    def get_is_followed(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.followed_by.filter(id=request.user.id).exists()
        return False
