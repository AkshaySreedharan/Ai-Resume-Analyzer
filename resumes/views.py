from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from .utils import (
    extract_text_from_pdf,
    extract_skills
)
from rest_framework.response import Response

from .models import Resume
from .serializers import ResumeSerializer


from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_resume(request):

    serializer = ResumeSerializer(
        data=request.data
    )

    if serializer.is_valid():

        resume = serializer.save(
            user=request.user
        )

        text = extract_text_from_pdf(
            resume.resume_file.path
        )

        skills = extract_skills(text)

        resume.extracted_text = text
        resume.extracted_skills = skills
        resume.save()

        return Response(
            ResumeSerializer(resume).data,
            status=201
        )

    return Response(
        serializer.errors,
        status=400
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_detail(request, pk):

    resume = Resume.objects.get(
        id=pk,
        user=request.user
    )

    return Response({
        "id": resume.id,
        "skills": resume.extracted_skills,
        "uploaded_at": resume.uploaded_at
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_resumes(request):
    resumes = Resume.objects.filter(user=request.user)
    serializer = ResumeSerializer(resumes, many=True)
    return Response(serializer.data)