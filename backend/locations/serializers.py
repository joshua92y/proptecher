# backend/locations/serializers.py
import json

from django.contrib.gis.geos import GEOSException
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from .models import Sido

DEFAULT_SIMPLIFY_TOLERANCE = 0.001


class SidoSerializer(serializers.ModelSerializer):
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = Sido
        fields = ["id", "name", "bjcd", "geometry"]
        @extend_schema_field(
            {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "coordinates": {"type": "array"},
                },
            }
        )
        def get_geometry(self, obj):
            return obj.geom_geojson
    def get_geometry(self, obj):
        annotated_geojson = getattr(obj, "geom_geojson", None)
        if annotated_geojson:
            try:
                return json.loads(annotated_geojson)
            except json.JSONDecodeError:
                return None

        tolerance = DEFAULT_SIMPLIFY_TOLERANCE
        request = self.context.get("request")
        raw_value = None
        if request is not None:
            raw_value = request.query_params.get("simplify")
            if raw_value is None and hasattr(request, "GET"):
                raw_value = request.GET.get("simplify")
        if raw_value is not None:
            try:
                tolerance = max(float(raw_value), 0.0)
            except (TypeError, ValueError):
                tolerance = DEFAULT_SIMPLIFY_TOLERANCE

        if not obj.geom:
            return None

        try:
            geom = obj.geom.transform(4326, clone=True)
            if tolerance > 0:
                geom = geom.simplify(tolerance, preserve_topology=True)
            return json.loads(geom.geojson)
        except GEOSException:
            return None

    def to_representation(self, instance):
        base = super().to_representation(instance)
        return {
            "type": "Feature",
            "id": base["id"],
            "properties": {
                "name": base["name"],
                "bjcd": base["bjcd"],
            },
            "geometry": base["geometry"],
        }
