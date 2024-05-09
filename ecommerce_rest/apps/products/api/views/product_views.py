from rest_framework import generics, status
from rest_framework.response import Response
from apps.base.api import GeneralListAPIView
from apps.products.api.serializers.product_serializers import ProductSerializer

'''
# List
class ProductListAPIView(GeneralListAPIView):
    serializer_class = ProductSerializer

# Vistas genéricas
# Retrieve: Mostrar detalles de objeto 
class ProductRetrieveAPIView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    
    # Necesario para indicar de donde extraer los objetos.
    def get_queryset(self):
        return self.get_serializer().Meta.model.objects.filter(state = True)

# Delete
class ProductDestroyAPIView(generics.DestroyAPIView):
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        return self.get_serializer().Meta.model.objects.filter(state = True)
    
    # Sobreescribir el metodo delete para realizar una eliminación simbólica (cambio de state).
    def delete(self,request,pk=None):
        product = self.get_queryset().filter(id = pk).first()
        if product:
            product.state = False
            product.save()
            return Response({'message':'Producto eliminado correctamente!'},status=status.HTTP_200_OK)
        return Response({'error':'No existe un producto con estos datos'}, status=status.HTTP_400_BAD_REQUEST)

# Update
class ProductUpdateAPIView(generics.UpdateAPIView):
    serializer_class = ProductSerializer
    
    def get_queryset(self,pk):
        return self.get_serializer().Meta.model.objects.filter(state = True).filter(id = pk).first()
    
    # Patch sirve para mostrar la información
    def patch(self,request,pk = None):
        if self.get_queryset(pk):
            product_serializer = self.serializer_class(self.get_queryset(pk))
            return Response(product_serializer.data, status=status.HTTP_200_OK)
        return Response({'error':'No existe un producto con estos datos'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Personalizando el PUT (Permite la validación definida en ProductSerializer)
    def put(self,request,pk = None):
        if self.get_queryset(pk):
            product_serializer = self.serializer_class(self.get_queryset(pk), data = request.data)
            if product_serializer.is_valid():
                product_serializer.save()
                return Response(product_serializer.data, status=status.HTTP_200_OK)
            return Response(product_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # Obs: comparar con las funciones de views en users.api
'''

# ListCreate (Elimina la necesidad de definir List)
class ProductListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    # Se necesita establecer un queryset para el get de ListCreate (se mestra antes del form)
    queryset = ProductSerializer.Meta.model.objects.filter(state = True)
    # def get_queryset es más escalable que queryset
    
    # Personalización del POST (Permite la validación definida en ProductSerializer)
    def post(self, request):
        serializer = self.serializer_class(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Producto creado correctamente!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# RetrieveUpdateDestroy: Unifica los procesos de Retrieve - Update - Destroy
class ProductRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    
    # Necesario para indicar de donde extraer los objetos.
    def get_queryset(self,pk = None):
        if pk is None:
            return self.get_serializer().Meta.model.objects.filter(state = True)
        else:
            return self.get_serializer().Meta.model.objects.filter(id = pk, state = True).first()
    
    # Patch sirve para mostrar la información
    def patch(self,request,pk = None):
        if self.get_queryset(pk):
            product_serializer = self.serializer_class(self.get_queryset(pk))
            return Response(product_serializer.data, status=status.HTTP_200_OK)
        return Response({'error':'No existe un producto con estos datos'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Personalizando el PUT (Permite la validación definida en ProductSerializer)
    def put(self,request,pk = None):
        if self.get_queryset(pk):
            product_serializer = self.serializer_class(self.get_queryset(pk), data = request.data)
            
        if product_serializer.is_valid():
            product_serializer.save()
            return Response(product_serializer.data, status=status.HTTP_200_OK)
        return Response(product_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    # Personalizando el DELETE (Permite realizar una eliminación simbólica (cambio de state))
    def delete(self,request,pk=None):
        product = self.get_queryset().filter(id = pk).first()
        if product:
            product.state = False
            product.save()
            return Response({'message':'Producto eliminado correctamente!'},status=status.HTTP_200_OK)
        return Response({'error':'No existe un producto con estos datos'}, status=status.HTTP_400_BAD_REQUEST)