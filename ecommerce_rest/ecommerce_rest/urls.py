from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Enlazar las urls de una app
    path('usuario/',include('apps.users.api.urls')),
    path('products/', include('apps.products.api.urls'))
]
