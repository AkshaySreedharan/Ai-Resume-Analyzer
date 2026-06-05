from django.urls import path

from .views import analyze

urlpatterns = [

    path(
        '<int:resume_id>/<int:job_id>/',
        analyze
    )
]