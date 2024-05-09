# from apps.products.models import MeasureUnit, Indicator, CategoryProduct

# Con esta linea se enlaza la view creada en base
from apps.base.api import GeneralListAPIView
from apps.products.api.serializers.general_serializers import MeasureUnitSerializer, IndicatorSerializer, CategoryProductSerializer

# Clase genérica predeterminada para listar: ListAPIView
class MeasureUnitListAPIView(GeneralListAPIView):
    serializer_class = MeasureUnitSerializer
    
    # get_queryset retorna lo que se define en una variable llamada queryset
#    def get_queryset(self):
#        return MeasureUnit.objects.filter(state = True)
    
class IndicatorListAPIView(GeneralListAPIView):
    serializer_class = IndicatorSerializer
    
class CategoryProductListAPIView(GeneralListAPIView):
    serializer_class = CategoryProductSerializer