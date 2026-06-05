from users.views import profile
from users.views import register_user
from django.urls import path

urlpatterns = [
    path('register/',register_user,name="register"),
    path('profile/',profile,name="profile") 
] 