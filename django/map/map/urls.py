from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('hurricane/', include('hurricane.urls')),
    path('admin/', admin.site.urls),
]