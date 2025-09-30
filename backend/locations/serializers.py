from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Sido

class SidoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Sido
        geo_field = "geom"
        fields = ("id", "name", "bjcd")

    def to_representation(self, instance):
        obj = super().to_representation(instance)
        geom = instance.geom.simplify(0.001, preserve_topology=True)
        obj["geometry"] = geom.geojson
        return obj
