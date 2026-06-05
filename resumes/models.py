from django.db import models
from django.contrib.auth.models import User

class Resume(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    resume_file = models.FileField(
        upload_to='resumes/'
    )

    extracted_text = models.TextField(
        blank=True
    )

    extracted_skills = models.JSONField(
        default=list
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )