"""
Centralized LLM prompt templates for all AI analysis operations.

All prompts return structured JSON to enable Pydantic validation of LLM outputs.
"""

RESUME_ANALYSIS_PROMPT = """You are an expert HR analyst and recruiter. Analyze the following resume text and extract structured data.

Return a JSON object with these exact fields:
{{
    "name": "Full name of the candidate",
    "email": "Email address if found, null otherwise",
    "phone": "Phone number if found, null otherwise",
    "skills": ["List of technical and soft skills"],
    "education": [
        {{
            "degree": "Degree name",
            "field": "Field of study",
            "institution": "University/School name",
            "year": "Graduation year or year range",
            "gpa": "GPA if mentioned, null otherwise"
        }}
    ],
    "experience": [
        {{
            "title": "Job title",
            "company": "Company name",
            "duration": "Duration string (e.g., '2 years', 'Jan 2020 - Dec 2022')",
            "description": "Brief description of responsibilities",
            "technologies": ["Technologies used in this role"]
        }}
    ],
    "certifications": ["List of certifications"],
    "projects": [
        {{
            "name": "Project name",
            "description": "Brief project description",
            "technologies": ["Technologies used"]
        }}
    ],
    "total_experience_years": 0,
    "strengths": "A paragraph describing the candidate's key strengths based on their resume",
    "weaknesses": "A paragraph describing potential gaps or areas for improvement",
    "skill_summary": "A concise 2-3 sentence summary of the candidate's skill profile",
    "job_fit_score": 0,
    "overall_score": 0
}}

Scoring Guidelines (0-100):
- **overall_score**: How strong is this resume overall? Consider completeness, relevance, experience depth, skill breadth, and presentation.
- **job_fit_score**: How well does this candidate fit a general tech role? Consider skill relevance, experience level, and industry alignment.

Be thorough, objective, and fair. Extract ALL skills mentioned, including those embedded in experience descriptions.

RESUME TEXT:
{resume_text}
"""

INTERVIEW_ANALYSIS_PROMPT = """You are an expert interview analyst. Analyze the following interview transcript and evaluate the candidate's performance.

Return a JSON object with these exact fields:
{{
    "communication_score": 0,
    "technical_score": 0,
    "confidence_score": 0,
    "clarity_score": 0,
    "problem_solving_score": 0,
    "overall_score": 0,
    "key_points": ["List of 5-10 key points from the interview"],
    "strengths": "A paragraph describing the candidate's interview strengths",
    "weaknesses": "A paragraph describing areas where the candidate could improve",
    "summary": "A comprehensive 3-5 sentence summary of the interview performance"
}}

Scoring Guidelines (0-100):
- **communication_score**: Clarity of expression, articulation, vocabulary usage, ability to convey ideas effectively
- **technical_score**: Depth and accuracy of technical knowledge demonstrated, ability to explain concepts
- **confidence_score**: Self-assurance, assertiveness, avoidance of excessive hedging language
- **clarity_score**: Organization of thoughts, logical flow, structured responses
- **problem_solving_score**: Analytical thinking, structured approach to problems, creative solutions
- **overall_score**: Weighted average considering all dimensions

Be objective and fair. Focus on the content and delivery quality.

INTERVIEW TRANSCRIPT:
{transcript}
"""

REPORT_GENERATION_PROMPT = """You are a professional HR report writer. Generate a comprehensive candidate evaluation report.

Given the following data about a candidate, create a detailed report summary.

Return a JSON object with these fields:
{{
    "executive_summary": "A 3-4 sentence executive summary of the candidate",
    "resume_summary": "Detailed summary of the candidate's resume and qualifications",
    "interview_summary": "Detailed summary of the interview performance",
    "combined_strengths": "Combined strengths from both resume and interview",
    "combined_weaknesses": "Combined areas for improvement",
    "missing_skills": ["List of commonly expected skills not demonstrated"],
    "hiring_recommendation": "A detailed hiring recommendation paragraph",
    "recommendation_category": "One of: highly_recommended, recommended, consider, not_recommended",
    "risk_factors": ["List of potential risk factors for hiring"],
    "development_areas": ["Areas where the candidate could grow"]
}}

CANDIDATE DATA:
Name: {name}
Resume Score: {resume_score}/100
Interview Score: {interview_score}/100
Final Score: {final_score}/100

Skills: {skills}
Experience: {experience}
Education: {education}

Resume Strengths: {resume_strengths}
Resume Weaknesses: {resume_weaknesses}

Interview Strengths: {interview_strengths}
Interview Weaknesses: {interview_weaknesses}
Interview Summary: {interview_summary}
"""

SEARCH_QUERY_PROMPT = """You are a query parser. Convert the following natural language search query into structured search filters.

Return a JSON object with these fields (use null for any field not mentioned in the query):
{{
    "skills": ["List of skills mentioned"],
    "min_experience_years": null,
    "max_experience_years": null,
    "education_level": null,
    "min_score": null,
    "max_score": null,
    "recommendation": null,
    "keywords": ["Other relevant keywords for text search"]
}}

SEARCH QUERY:
{query}
"""
