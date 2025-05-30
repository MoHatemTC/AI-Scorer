from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from skill_extraction_agent import SkillExtractionAgent
from generate_rubric_agent_2 import RubricGenerationAgent
from AIGrader import AIGrader
from typing import List, Optional
from urllib.parse import urlparse, unquote
from helpers.downloader import download_and_parse_file
from supabase import Client
from supabase_db import get_db
import requests
import json

load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
METABASE_URL = os.getenv("METABASE_URL", "")
USERNAME = os.getenv("METABASE_USERNAME", "")
PASSWORD = os.getenv("METABASE_PASSWORD", "")
DATABASE_ID = int(os.getenv("METABASE_DATABASE_ID", 2))


# Request models
class QueryRequest(BaseModel):
    sql: str


def get_session_token():
    login_url = f"{METABASE_URL}/api/session"
    payload = {"username": USERNAME, "password": PASSWORD}
    headers = {"Content-Type": "application/json"}

    response = requests.post(login_url, headers=headers, json=payload)
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, detail="Failed to authenticate."
        )
    return response.json().get("id")


def run_native_query(session_token: str, sql: str):
    dataset_url = f"{METABASE_URL}/api/dataset/"
    headers = {
        "Content-Type": "application/json",
        "X-Metabase-Session": session_token,
    }
    body = {
        "database": DATABASE_ID,
        "type": "native",
        "native": {"query": sql},
        "parameters": [],
    }

    response = requests.post(dataset_url, headers=headers, json=body)
    if response.status_code not in [200, 202]:
        raise HTTPException(
            status_code=response.status_code, detail="Query execution failed."
        )
    return response.json()


import requests


@app.get("/")
def root():
    return {"message": "Welcome to Metabase API via FastAPI 🚀"}


@app.get("/download_file")
def download_file(url: str = Query(...)):
    try:
        # Extract filename from the URL
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        filename = unquote(filename)  # decode URL-encoded characters

        # Save to ./temp/filename
        output_path = os.path.join("temp", filename)
        os.makedirs("temp", exist_ok=True)

        # Download and save file
        response = requests.get(url)
        response.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(response.content)

        return {"message": f"File downloaded to {output_path}"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})


@app.get("/auth")
def authenticate():
    token = get_session_token()
    return {"token": token}


@app.post("/query")
def query_metabase(request: QueryRequest):
    token = get_session_token()
    result = run_native_query(token, request.sql)
    return JSONResponse(result)


# Grader


# Pydantic models for request/response
class GraderUser(BaseModel):
    id: int
    fullName: str
    email: str
    profilePicture: str | None
    status: str
    submissions: str | None
    submissionId: int | None


class GraderInput(BaseModel):
    task_description: str
    journey_name: str
    scope_rubric: str
    requirements_rubric: str
    solution: Optional[str] = None
    solution_url: Optional[str] = None
    users: List[GraderUser] = []


@app.post("/evaluate")
def evaluate_submission(grader_input: GraderInput):
    try:
        # Initialize the AI Grader once (for efficiency)
        grader = AIGrader()
        results = []

        # Parse rubrics if they are JSON strings
        try:
            scope_rubric = (
                json.loads(grader_input.scope_rubric)
                if isinstance(grader_input.scope_rubric, str)
                else grader_input.scope_rubric
            )
            requirements_rubric = (
                json.loads(grader_input.requirements_rubric)
                if isinstance(grader_input.requirements_rubric, str)
                else grader_input.requirements_rubric
            )
        except json.JSONDecodeError:
            # If not valid JSON, use as string
            scope_rubric = grader_input.scope_rubric
            requirements_rubric = grader_input.requirements_rubric

        # Case 1: Bulk grading with users
        if grader_input.users:
            for user in grader_input.users:
                if not user.submissions:
                    # Skip users with no submission
                    continue

                # Download and parse the submission file
                file_content = download_and_parse_file(user.submissions)
                if not file_content:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to download submission for user {user.id}",
                    )

                # Process the task for this user's submission
                scope, quality = grader.process_tasks(
                    grader_input.task_description,
                    grader_input.journey_name,
                    scope_rubric,
                    requirements_rubric,
                    solution=file_content,
                )

                # Append results for this user
                results.append(
                    {
                        "user_id": user.id,
                        "scope": {
                            "criteria": scope["criteria"],
                            "overall_grade": scope["scope_score"],
                            "overall_comment": scope["scope_comment"],
                        },
                        "quality": {
                            "criteria": quality["criteria"],
                            "overall_grade": quality["quality_score"],
                            "overall_comment": quality["quality_comment"],
                        },
                    }
                )

            if not results:
                raise HTTPException(
                    status_code=400,
                    detail="No valid submissions found in the users list.",
                )

        # Case 2: Single grading with solution or solution_url
        else:
            if not grader_input.solution and not grader_input.solution_url:
                raise HTTPException(
                    status_code=400,
                    detail="Either solution, solution_url, or users must be provided.",
                )

            # Use solution_url if provided, otherwise use solution directly
            if grader_input.solution_url:
                file_content = download_and_parse_file(grader_input.solution_url)
                if not file_content:
                    raise HTTPException(
                        status_code=400,
                        detail="Failed to download solution from solution_url.",
                    )
                grader_input.solution = file_content

            # Process the single submission
            scope, quality = grader.process_tasks(
                grader_input.task_description,
                grader_input.journey_name,
                scope_rubric,
                requirements_rubric,
                grader_input.solution,
            )

            # Append single result (no user_id since no user context)
            results.append(
                {
                    "scope": {
                        "criteria": scope["criteria"],
                        "overall_grade": scope["scope_score"],
                        "overall_comment": scope["scope_comment"],
                    },
                    "quality": {
                        "criteria": quality["criteria"],
                        "overall_grade": quality["quality_score"],
                        "overall_comment": quality["quality_comment"],
                    },
                }
            )

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grading error: {str(e)}")


#  Endpoint for rubric generation


class RubricGenerationRequest(BaseModel):
    task_id: str
    task_description: str


@app.post("/generate_rubric")
async def generate_rubric(
    request: RubricGenerationRequest, supabase: Client = Depends(get_db)
):
    try:
        print("Generating rubric...")  # Debug log
        # Check for existing rubric in the database using task_id
        existing_rubric = (
            supabase.table("assignments")
            .select(
                "deliverable_rubric, quality_rubric, max_score, passed_score, final_score"
            )
            .eq("assignment_id", request.task_id)
            .execute()
        )

        if existing_rubric.data:
            deliverable_rubric = json.loads(
                existing_rubric.data[0]["deliverable_rubric"]
            )
            quality_rubric = json.loads(existing_rubric.data[0]["quality_rubric"])

            return {
                "rubric": {
                    "Scope": deliverable_rubric,
                    "Quality": quality_rubric,
                    "max_score": existing_rubric.data[0].get("max_score"),
                    "passed_score": existing_rubric.data[0].get("passed_score"),
                    "final_score": existing_rubric.data[0].get("final_score"),
                }
            }

        # Generate new rubric using the task description
        agent = RubricGenerationAgent()
        rubric = agent.run([request.task_description])
        return {"rubric": rubric}
    except Exception as e:
        print(f"METABASE_URL: {METABASE_URL}")
        print(f"Error generating rubric: {str(e)}")
        raise HTTPException(
            status_code=400, detail=f"Rubric generation error: {str(e)}"
        )


# Supabase integration

# Saving rubric to Supabase


class RubricSaveRequest(BaseModel):
    task_id: str
    deliverable_rubric: str  # Assuming it's sent as a JSON string
    quality_rubric: str


@app.post("/save_rubric")
async def save_rubric(request: RubricSaveRequest, supabase: Client = Depends(get_db)):
    try:
        data = {
            "assignment_id": request.task_id,
            "deliverable_rubric": request.deliverable_rubric,
            "quality_rubric": request.quality_rubric,
        }
        # check if there is an existing assignment with the same task_id
        existing_assignment = (
            supabase.table("assignments")
            .select("assignment_id")
            .eq("assignment_id", request.task_id)
            .execute()
        )

        if existing_assignment.data:
            # Update the existing assignment
            supabase.table("assignments").update(
                {
                    "deliverable_rubric": request.deliverable_rubric,
                    "quality_rubric": request.quality_rubric,
                }
            ).eq("assignment_id", request.task_id).execute()
        else:
            # Insert a new assignment
            supabase.table("assignments").insert(data).execute()
        return {"message": "Rubrics saved successfully!"}
    except Exception as e:
        return {"message": f"Hello World - Error querying database: {str(e)}"}


# save user grade to supabase

class CriterionModel(BaseModel):
    name: str
    grade: int
    chosen_level: int
    comment: str


class User(BaseModel):
    id: int
    fullName: str
    email: str
    profilePicture: str | None
    status: str
    grade: int | None
    submissions: str | None
    submissionId: int | None

class SaveGradingResultsRequest(BaseModel):
    user_id: int
    scope_overall_grade: int
    scope_overall_comment: str
    quality_overall_grade: int
    quality_overall_comment: str
    taskId: str
    user: User
    scope_criteria: List[CriterionModel]
    quality_criteria: List[CriterionModel]


@app.post("/save_grading_results")
async def save_grading_results(
    request: SaveGradingResultsRequest, supabase: Client = Depends(get_db)
):
    try:
        # Validate scores
        if not (0 <= request.scope_overall_grade <= 100) or not (
            0 <= request.quality_overall_grade <= 100
        ):
            raise HTTPException(
                status_code=400, detail="Scores must be between 0 and 100."
            )

        # Prepare data for the users_grades table
        grading_data = {
            "user_id": request.user_id,
            "task_id": request.taskId,
            "scope_score": request.scope_overall_grade,
            "scope_comment": request.scope_overall_comment,
            "quality_score": request.quality_overall_grade,
            "quality_comment": request.quality_overall_comment,
            "full_name": request.user.fullName,
            "email": request.user.email,
            "scope_criteria": json.dumps(
                [criterion.dict() for criterion in request.scope_criteria]
            ),
            "quality_criteria": json.dumps(
                [criterion.dict() for criterion in request.quality_criteria]
            ),
        }

        # Check if a grading record already exists for this user and task
        existing_grade = (
            supabase.table("users_grades")
            .select("user_id, task_id")
            .eq("user_id", request.user_id)
            .eq("task_id", request.taskId)
            .execute()
        )

        if existing_grade.data:
            # Update existing record
            response = (
                supabase.table("users_grades")
                .update(grading_data)
                .eq("user_id", request.user_id)
                .eq("task_id", request.taskId)
                .execute()
            )
        else:
            # Insert new record
            response = supabase.table("users_grades").insert(grading_data).execute()

        # Check for errors in the Supabase response
        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save grading results to the database.",
            )

        return {"message": "Grading results saved successfully!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving grading results: {str(e)}"
        )
