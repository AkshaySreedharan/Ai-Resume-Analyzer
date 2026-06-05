from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import JobDescription
from .serializers import JobSerializer

from resumes.utils import extract_skills

@api_view(['POST'])
def create_job(request):

    serializer = JobSerializer(
        data=request.data
    )

    if serializer.is_valid():

        job = serializer.save()

        skills = extract_skills(
            job.description
        )

        job.extracted_skills = skills

        job.save()

        return Response(
            JobSerializer(job).data,
            status=201
        )

    return Response(
        serializer.errors,
        status=400
    )


@api_view(['GET'])
def list_jobs(request):
    jobs = JobDescription.objects.all()
    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)