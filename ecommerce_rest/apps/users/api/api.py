from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from apps.users.models import User
from apps.users.api.serializers import *


@api_view(['GET','POST']) 
def user_api_view(request):
    # List
    if request.method == 'GET':
        # queryset
        users = User.objects.all().values('id','username','email','password','name')
        # many para convertir a json un LISTADO de datos
        users_serializer = UserListSerializer(users, many=True)       
        return Response(users_serializer.data, status = status.HTTP_200_OK)
    
    # Create    
    elif request.method == 'POST': 
        user_serializer = UserSerializer(data = request.data)
        # Validation
        if user_serializer.is_valid():
            user_serializer.save()
            return Response({'message': 'Usuario creado correctamente!'}, status=status.HTTP_201_CREATED)
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def user_detail_api_view(request,pk):
    user = User.objects.filter(id = pk).first()
    if user:
        
        # Listar/Retrieve (Individualmente)
        if request.method == 'GET':
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data, status.HTTP_200_OK)
        
        # Editar/Update
        elif request.method == 'PUT':
            user_serializer = UserSerializer(user, data = request.data)
            if user_serializer.is_valid():
                # Cuando se ejecuta este save, se llama a la funcion definida como update en serializers
                user_serializer.save()
                return Response(user_serializer.data, status.HTTP_200_OK)
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Eliminar/Delete
        elif request.method == 'DELETE':
            user = User.objects.filter(id = pk).first()
            user.delete()
            return Response({'message': 'Usuario eliminado correctamente!'}, status = status.HTTP_200_OK)
        
    return Response({'message': 'No se ha encontrado un usuario con estos datos'}, status = status.HTTP_400_BAD_REQUEST)