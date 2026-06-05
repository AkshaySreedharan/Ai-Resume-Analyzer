from rest_framework import serializers
from .models import Resume


class ResumeSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Resume

        fields = [
            'id',
            'resume_file',
            'extracted_text',
            'extracted_skills',
            'uploaded_at'
        ]