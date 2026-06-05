import fitz
from .skills import SKILLS  
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.metrics.pairwise import cosine_similarity

def extract_text_from_pdf(pdf_path):

    document = fitz.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text()

    document.close()

    return text

def extract_skills(text):

    text = text.lower()

    found_skills = []

    for skill in SKILLS:

        if skill.lower() in text:

            found_skills.append(skill)

    return found_skills

def analyze_resume(resume_skills, job_skills):
    resume_set = set(resume_skills)
    job_set = set(job_skills)

    matched_skills = resume_set.intersection(job_set)
    missing_skills = job_set - resume_set

    if len(job_set) == 0:
        score = 0
    else:
        score = (len(matched_skills) / len(job_set)) * 100

    return {
        "match_score": round(score, 2),
        "matched_skills": list(matched_skills),
        "missing_skills": list(missing_skills)
    }


def calculate_similarity(resume_text, job_text):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([
        resume_text,
        job_text
    ])

    similarity = cosine_similarity(
        vectors[0:1],
        vectors[1:2]
    )

    score = similarity[0][0] * 100
    return round(score, 2)


def generate_recommendation(similarity_score):
    if similarity_score >= 80:
        return "Excellent Match"
    elif similarity_score >= 60:
        return "Good Match"
    elif similarity_score >= 40:
        return "Average Match"
    return "Needs Improvement"