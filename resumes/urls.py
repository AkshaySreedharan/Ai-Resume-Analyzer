from django.urls import path
from .views import upload_resume, resume_detail, list_resumes

urlpatterns = [
    path('', list_resumes, name='list_resumes'),
    path('upload/', upload_resume, name='upload_resume'),
    path('<int:pk>/', resume_detail, name='resume_detail'),      
]