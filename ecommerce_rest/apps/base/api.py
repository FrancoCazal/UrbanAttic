from rest_framework import generics

class GeneralListAPIView(generics.ListAPIView):
    serializer_class = None
    
    # def_queryset retorna lo que se define en la variable serializer_class
    def get_queryset(self):
        # De esta forma se accede al modelo del serializador asignado en la class Meta.
        model = self.get_serializer().Meta.model
        return model.objects.filter(state=True)