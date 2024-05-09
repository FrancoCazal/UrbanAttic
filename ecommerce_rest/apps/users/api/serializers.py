from rest_framework import serializers
from apps.users.models import User

# Convierte una instancia de un modelo en django y la convierte en una estructura de json
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        
    def create(self, validated_data):
        user = User(**validated_data)
        # set_password encripta la contraseña haciendo posible el inicio de sesión.
        user.set_password(validated_data['password'])
        user.save()
        return user
    
    def update(self, instance, validated_data):
        updated_user = super().update(instance, validated_data)
        # Se encripta la contraseña al hacer un put
        updated_user.set_password(validated_data['password'])
        updated_user.save()
        return updated_user
    
# Se crean serializadores especificos para cada método para mayor comodidad y evitar problemas
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        
    def to_representation(self, instance):
        return {
            'id': instance['id'], # Corchetes porque en el api se tiene .values o sea es un vector.
            'username': instance['username'], # Si fuera un diccionario (solo .all()) se haría instance.username
            'email': instance['email'],
            'password': instance['password']
        }