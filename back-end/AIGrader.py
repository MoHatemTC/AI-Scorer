from crewai import Agent, Task, Crew, Process
import os
import base64
import openlit
import json_repair
import json
from langfuse.openai import openai
from pydantics import (
    RequirementsConfig,
    QualityScoringConfig,
    ScopeConfig,
    ScopeScoringConfig,
)



LANGFUSE_SECRET_KEY = "sk-lf-b90245cc-b297-4599-82fa-ca89aa50ddca"
LANGFUSE_PUBLIC_KEY = "pk-lf-1406ba99-9e8e-4316-bd38-baa13a1e8020"
LANGFUSE_HOST = "https://us.cloud.langfuse.com"
os.environ["LANGFUSE_SECRET_KEY"] = LANGFUSE_SECRET_KEY
os.environ["LANGFUSE_PUBLIC_KEY"] = LANGFUSE_PUBLIC_KEY
os.environ["LANGFUSE_HOST"] = LANGFUSE_HOST

LANGFUSE_AUTH = base64.b64encode(
    f"{LANGFUSE_PUBLIC_KEY}:{LANGFUSE_SECRET_KEY}".encode()
).decode()

# os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "https://cloud.langfuse.com/api/public/otel"
# US data region
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = (
    "https://us.cloud.langfuse.com/api/public/otel"
)
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"
openlit.init()


OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

client = openai.OpenAI(api_key=OPENAI_API_KEY)


class AIGrader:
    def __init__(self):
        # Create the task-related agents
        self.create_agents()

        # Initialize the crew with only task agents for sequential processing
        self.crew = Crew(
            agents=[
                self.task_parser_agent,
                self.task_requirements_scoring_agent,
                self.task_scope_scoring_agent,
            ],
            tasks=[],  # Tasks will be added dynamically
            verbose=True,
            process=Process.sequential,  # Ensures tasks are executed one after the other
        )

    def create_agents(self):
        # Task Parser Agent (for parsing requirements and deliverables)
        self.task_parser_agent = Agent(
            role="Document reader and parser",
            goal="Extracting the tasks requirements and deliverables from given task description document task description in the field of journey name",
            backstory=(
                "An expert educational technical expert with extensive experience in evaluating "
                "learners' delivered tasks and projects across various technical fields."
            ),
            # llm="gpt-4",
            max_iter=20,
        )

        # Task Requirements Scoring Agent (for scoring the quality of requirements)
        self.task_requirements_scoring_agent = Agent(
            role="Scoring learners' delivered task quality",
            goal="Scoring task requirement versus a given quality rubric",
            backstory=(
                "An experienced software engineer who can meticulously evaluate code by interpreting "
                "and running it to ensure that all listed requirements are met."
            ),
            # llm="o3-mini",
            max_iter=20,
        )

        # Task Scope Scoring Agent (for scoring the task scope/deliverables)
        self.task_scope_scoring_agent = Agent(
            role="Scoring learners' delivered tasks scope",
            goal="Scoring task scope versus a given scope",
            backstory=(
                "An experienced software engineer capable of carefully verifying that all deliverables "
                "are addressed in the submitted code."
            ),
            # llm="o3-mini",
            max_iter=20,
        )

    def process_tasks(
        self,
        task_description,
        journey_name,
        scope_rubric,
        requirements_rubric,
        solution,
    ):
        print(f"Processing tasks for {task_description} in the {journey_name} journey")
        print(f"Scope rubric type: {type(scope_rubric)}")
        print(f"Requirements rubric type: {type(requirements_rubric)}")

        # Convert rubrics to string format for the agents if they are objects
        scope_rubric_str = (
            json.dumps(scope_rubric)
            if isinstance(scope_rubric, (dict, list))
            else str(scope_rubric)
        )
        requirements_rubric_str = (
            json.dumps(requirements_rubric)
            if isinstance(requirements_rubric, (dict, list))
            else str(requirements_rubric)
        )

        """
        Processes a series of tasks sequentially:
          1. Parsing task requirements and scoring them.
          2. Parsing task deliverables and scoring the scope.
        The output of each task is first returned as a JSON string.
        We then convert each output to a dictionary so that it can be validated by the respective Pydantic models.
        """
        # Task: Parse task requirements with output conforming to RequirementsConfig
        parsing_requirements_task = Task(
            description=f"Carefully analyze and extract ALL the specific requirements from this task description: '{task_description}' for the {journey_name} journey. List every single requirement, feature, or functionality that needs to be implemented. Do not miss any details.",
            expected_output="JSON object such as {'requirements_list': ['item1', 'item2', ...]}",
            agent=self.task_parser_agent,
            output_json=RequirementsConfig,
        )

        # Task: Score the parsed requirements using a quality rubric; output uses QualityScoringConfig
        scoring_requirements_task = Task(
            description=(
                f"Analyze the task solution '{solution}' against the quality rubric '{requirements_rubric_str}'. "
                f"IMPORTANT: You MUST return a JSON object with this exact structure: "
                f"{{"
                f"  'criteria': ["
                f"    {{"
                f"      'name': 'criterion_name',"
                f"      'grade': number_grade,"
                f"      'chosen_level': level_number (1, 2, 3, etc.),"
                f"      'comment': 'justification'"
                f"    }}"
                f"  ],"
                f"  'quality_score': total_sum_of_grades,"
                f"  'quality_comment': 'overall_assessment'"
                f"}}"
                f"For each criterion in the rubric: "
                f"1. Identify the criterion name exactly as in the rubric "
                f"2. Determine which level (1, 2, 3, etc.) best matches the solution based on the level descriptions "
                f"3. Assign a grade within that level's range "
                f"4. Provide clear justification including the level description that was matched "
                f"5. Sum all grades for quality_score "
                f"6. For 'chosen_level' field, use only the level number (1, 2, 3, etc.), not the description "
                f"Rules: Task '{task_description}' must relate to '{journey_name}' journey, otherwise all grades = 0"
            ),
            expected_output="Valid JSON object with 'criteria' array containing objects with 'name', 'grade', 'chosen_level' (as number), 'comment' fields, plus 'quality_score' and 'quality_comment'",
            agent=self.task_requirements_scoring_agent,
            context=[parsing_requirements_task],
        )

        # Task: Parse task deliverables (scope) with output conforming to ScopeConfig
        parsing_scope_task = Task(
            description=f"Carefully analyze and extract ALL the specific deliverables, outputs, and components from this task description: '{task_description}' for the {journey_name} journey. List every file, module, feature, or deliverable that should be produced. Do not miss any details.",
            expected_output="JSON object with all task deliverables such as {'deliverables_list': ['item1', 'item2', ...]}",
            agent=self.task_parser_agent,
            output_json=ScopeConfig,
        )

        # Task: Score the parsed scope using a scope rubric; output uses ScopeScoringConfig
        scoring_scope_task = Task(
            description=(
                f"Analyze the task solution '{solution}' against the scope rubric '{scope_rubric_str}'. "
                f"IMPORTANT: You MUST return a JSON object with this exact structure: "
                f"{{"
                f"  'criteria': ["
                f"    {{"
                f"      'name': 'criterion_name',"
                f"      'grade': number_grade,"
                f"      'chosen_level': level_number (1, 2, 3, etc.),"
                f"      'comment': 'justification'"
                f"    }}"
                f"  ],"
                f"  'scope_score': total_sum_of_grades,"
                f"  'scope_comment': 'overall_assessment'"
                f"}}"
                f"For each criterion in the rubric: "
                f"1. Identify the criterion name exactly as in the rubric "
                f"2. Determine which level (1, 2, 3, etc.) best matches the solution based on the level descriptions "
                f"3. Assign a grade within that level's range "
                f"4. Provide clear justification including the level description that was matched "
                f"5. Sum all grades for scope_score "
                f"6. For 'chosen_level' field, use only the level number (1, 2, 3, etc.), not the description "
                f"Rules: Task '{task_description}' must relate to '{journey_name}' journey, otherwise all grades = 0"
            ),
            expected_output="Valid JSON object with 'criteria' array containing objects with 'name', 'grade', 'chosen_level' (as number), 'comment' fields, plus 'scope_score' and 'scope_comment'",
            agent=self.task_scope_scoring_agent,
            context=[parsing_scope_task],
        )

        # Add all tasks to the crew's task list
        self.crew.tasks.extend(
            [
                parsing_requirements_task,
                scoring_requirements_task,
                parsing_scope_task,
                scoring_scope_task,
            ]
        )
        # Execute all tasks sequentially
        self.crew.kickoff()
        scope = self.crew.tasks[3].output
        scope = str(scope)
        scope = json_repair.loads(scope)

        quality = self.crew.tasks[1].output
        quality = str(quality)
        quality = json_repair.loads(quality)

        # Debug: Print raw outputs
        print("RAW SCOPE OUTPUT:")
        print(scope)
        print("RAW QUALITY OUTPUT:")
        print(quality)

        # Ensure we have the criteria structure
        if "criteria" not in scope or not scope["criteria"]:
            scope = self.create_fallback_criteria(scope, scope_rubric, "scope")

        if "criteria" not in quality or not quality["criteria"]:
            quality = self.create_fallback_criteria(
                quality, requirements_rubric, "quality"
            )

        print("FINAL SCOPE RESULTS:")
        print(scope)
        print("FINAL QUALITY RESULTS:")
        print(quality)

        return scope, quality

    def create_fallback_criteria(self, results, rubric, result_type):
        """Create fallback criteria structure if agents didn't return proper format"""
        criteria = []

        # If rubric is a list (structured rubric), extract criteria names
        if isinstance(rubric, list):
            for criterion in rubric:
                if isinstance(criterion, dict) and "name" in criterion:
                    criteria.append(
                        {
                            "name": criterion["name"],
                            "grade": 0,
                            "chosen_level": 1,
                            "comment": "No proper evaluation provided by the agent",
                        }
                    )
        else:
            # Fallback for unstructured rubric
            criteria = [
                {
                    "name": "General Assessment",
                    "grade": results.get(f"{result_type}_score", 0),
                    "chosen_level": 1,
                    "comment": results.get(
                        f"{result_type}_comment", "No detailed assessment available"
                    ),
                }
            ]

        return {
            "criteria": criteria,
            f"{result_type}_score": results.get(f"{result_type}_score", 0),
            f"{result_type}_comment": results.get(f"{result_type}_comment", ""),
        }
