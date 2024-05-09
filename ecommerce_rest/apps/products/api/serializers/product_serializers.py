from rest_framework import serializers
from apps.products.models import Product
from apps.products.api.serializers.general_serializers import MeasureUnitSerializer, CategoryProductSerializer

# Archivo de serializer para modelo principal
class ProductSerializer(serializers.ModelSerializer):
# Formas de mostrar atributos con sus nombres:
    # Método 1
#    measure_unit = MeasureUnitSerializer()
#    category_poroduct = CategoryProductSerializer()

    # Método 2
#    measure_unit = serializers.StringRelatedField()
#    category_product = serializers.StringRelatedField()
    
    class Meta:
        model = Product
        exclude = ('state','created_date','modified_date','deleted_date')
        
    # Método 3
    def to_representation(self, instance):
        return {
            'id': instance.id,
            'name': instance.name,
            'description': instance.description,
            # Los siguientes atributos tienen validaciones para campos que se envian vacíos, ya sea para create o update
            'image': instance.image if instance.image != '' else '',
            'measure_unit': instance.measure_unit.description if instance.measure_unit is not None else '',
            'category_product': instance.category_product.description if instance.category_product is not None else ''
        }