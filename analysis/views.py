from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from resumes.models import Resume
from jobs.models import JobDescription
from resumes.utils import analyze_resume, calculate_similarity


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analyze(request, resume_id, job_id):
    resume = Resume.objects.get(
        id=resume_id,
        user=request.user
    )

    job = JobDescription.objects.get(
        id=job_id
    )

    result = analyze_resume(
        resume.extracted_skills,
        job.extracted_skills
    )

    similarity_score = calculate_similarity(
        resume.extracted_text,
        job.description
    )

    return Response({
        "skill_match_score": result["match_score"],
        "text_similarity_score": similarity_score,
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"]
    })
