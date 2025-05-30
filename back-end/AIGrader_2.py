from crewai import Agent, Task, Crew, Process
import os
import base64
import openlit
import json_repair
from langfuse.openai import openai
from pydantics import RequirementsConfig, QualityScoringConfig, ScopeConfig, ScopeScoringConfig

OPENAI_API_KEY = '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'
MODEL = 'o3-mini'

LANGFUSE_SECRET_KEY = 'sk-lf-b90245cc-b297-4599-82fa-ca89aa50ddca'
LANGFUSE_PUBLIC_KEY = 'pk-lf-1406ba99-9e8e-4316-bd38-baa13a1e8020'
LANGFUSE_HOST = "https://us.cloud.langfuse.com"
os.environ["LANGFUSE_SECRET_KEY"] = LANGFUSE_SECRET_KEY
os.environ["LANGFUSE_PUBLIC_KEY"] = LANGFUSE_PUBLIC_KEY
os.environ["LANGFUSE_HOST"] = LANGFUSE_HOST

LANGFUSE_AUTH = base64.b64encode(
    f"{LANGFUSE_PUBLIC_KEY}:{LANGFUSE_SECRET_KEY}".encode()).decode()

# os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "https://cloud.langfuse.com/api/public/otel"
# US data region
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "https://us.cloud.langfuse.com/api/public/otel"
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"
openlit.init()


os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

client = openai.OpenAI(api_key=OPENAI_API_KEY)


def extract_info(prompt):
    system_prompt = (
        "You are an information extractor. Given a sentence which is {prompt}, extract the learners scope_score, scope_comment, quality, quality_comment. "
        "Return the result in JSON format like this: {\"scope_score\": ..., \"scope_comment\": ..., \"quality_score\": ..., \"quality_comment\": ...}"
    )

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    result = response.choices[0].message.content
    return result
# Revised AIGrader class with task-related agents only


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
            process=Process.sequential  # Ensures tasks are executed one after the other
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

    def process_tasks(self, task_description, journey_name, scope_rubric, requirements_rubric, solution):
        """
        Processes a series of tasks sequentially:
          1. Parsing task requirements and scoring them.
          2. Parsing task deliverables and scoring the scope.
        The output of each task is first returned as a JSON string.
        We then convert each output to a dictionary so that it can be validated by the respective Pydantic models.
        """
        # Task: Parse task requirements with output conforming to RequirementsConfig
        parsing_requirements_task = Task(
            description=f"Parsing the task requirements list from {task_description} without changing them in the field on {journey_name}",
            expected_output="JSON object such as {'requirements_list': ['item1', 'item2', ...]}",
            agent=self.task_parser_agent,
            output_json=RequirementsConfig
        )

        # Task: Score the parsed requirements using a quality rubric; output uses QualityScoringConfig
        scoring_requirements_task = Task(
            description=(
                f"Scoring task quality based on the {requirements_rubric} giving a comprehensive overall "
                f"score from 0 to 100 for this {solution}"
            ),
            expected_output="Build a tidy table showing each criterion, its score, and a short comment and Make sure the scores total 100. Add a concise overall comment about the quality of the task. Return the summary JSON in the requested format",
            agent=self.task_requirements_scoring_agent,
            context=[parsing_requirements_task],
            output_json=QualityScoringConfig
        )

        # Task: Parse task deliverables (scope) with output conforming to ScopeConfig
        parsing_scope_task = Task(
            description=f"Parsing the task deliverables list from {task_description} without changing them in the field of {journey_name}",
            expected_output="JSON object with all task deliverables such as {'deliverables_list': ['item1', 'item2', ...]}',}",
            agent=self.task_parser_agent,
            output_json=ScopeConfig
        )

        # Task: Score the parsed scope using a scope rubric; output uses ScopeScoringConfig
        scoring_scope_task = Task(
            description=(
                f"Scoring task scope based on the {scope_rubric} giving a comprehensive overall score from 0 to 100 "
                f"for this {solution}"
            ),
            expected_output="Build a tidy table showing each criterion, its score, and a short comment and Make sure the scores total 100. Add a concise overall comment about the scope of the task. Return the summary JSON in the requested format",
            agent=self.task_scope_scoring_agent,
            context=[parsing_scope_task],
            output_json=ScopeScoringConfig
        )

        # Add all tasks to the crew's task list
        self.crew.tasks.extend([
            parsing_requirements_task,
            scoring_requirements_task,
            parsing_scope_task,
            scoring_scope_task,
        ])
        # Execute all tasks sequentially
        self.crew.kickoff()
        scope = self.crew.tasks[3].output
        scope = str(scope)
        scope = json_repair.loads(scope)
        print("*******SCOOOOOOOOOOOOOOOOPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE*")
        print(scope)
        quality = self.crew.tasks[1].output
        quality = str(quality)
        quality = json_repair.loads(quality)
        print("*QUAILTTTTYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY")
        print(quality)
        return scope, quality
