import json
import re

from openai import OpenAI

openai = OpenAI()


class RubricGenerationAgent:
    def __init__(self, model="o3-mini"):
        self.model = model

    def run(self, task_list, output_file="rubric.json"):
        if not task_list or not isinstance(task_list, list):
            print("No valid task provided.")
            return []

        task = task_list[0]

        prompt = """
You are an expert evaluator building a binary-based scoring rubric for an AI grading system.

You will receive a task that includes:
- A title
- A description
- A list of requirements

Your job is to generate a rubric that can be used to **automatically score** a student's solution.

### Rubric Guidelines:
- The rubric must be structured into two sections each section is evluated separately from 100:
- "Scope" — evaluates the completeness of the solution based on the task requirements.
- "Quality" — evaluates the quality of the solution based on the task requirements.
### Definitions:
  1. "Scope" — is defined as the following: 
  How students fulfill the requirements and meet the deadline.
The delivered scope in project/task delivery refers to the specific set of deliverables or outcomes that have been completed and provided to the stakeholders at the end of a project or task. It represents the work that has been successfully accomplished and meets the agreed-upon requirements and objectives.
The delivered scope can include various elements, such as completed project deliverables, finalized reports, implemented solutions, finished products, or any other tangible or intangible results that were expected from the project or task.
It is important to clearly define the delivered scope to ensure that all parties involved have a shared understanding of what has been accomplished and what has been delivered. This helps in assessing the success of the project or task and determining if it meets the desired goals and requirements.
     - Focus on whether each required feature exists or not.
  2. "Quality" — is defined as the following: 
  Quality in project/task delivery refers to the degree to which the completed work meets the specified requirements, standards, and expectations. It encompasses various aspects, including accuracy, completeness, functionality, reliability, usability, and overall satisfaction of the stakeholders.
Here are some key points to consider when evaluating the quality of project/task delivery:
Requirements Compliance: Assess whether the delivered work meets the defined requirements and specifications. This involves verifying that all necessary features, functionalities, and performance criteria have been met.
Accuracy and Precision: Evaluate the accuracy and precision of the delivered work. This includes checking for any errors, inconsistencies, or deviations from the intended outcomes.
Fitness for Purpose: Determine if the delivered work fulfills its intended purpose and meets the needs of the stakeholders. This involves assessing whether the work aligns with the desired goals and objectives.
##Rules for Generating the Rubric:
Some rules to abide by: Generate the rubrics by the following steps in table format: 
1- Get task requirements and deliverables from the user sent task description
2- Translate them from  3 to 7 scope criteria
3- Weight them according to their weights and make sure they sum up to 100 only
4- Make from 3 to 5 levels of each criteria of the scope 
5- Each level has a grade range which its minimum level 0 an and the maximum level is the criteria weight itself 
6- The levels  descriptions shall very binary defined as it 's can't be misunderstood by anyone and if it's used by many mentors who uses this rubric to correct the answer, they all shall get the same answer
7- Think for quality criteria to evaluate these proposed scope criteria (get form 5 to 10 of them) 
9- Weighted according to importance and  make sure it weights sum up to 100 only
10- Make from 3 to 5 levels of each criteria of the quality
11- Each level has a grade range which its minimum level 0 an and the maximum level is the criteria weight itself 
12- the levels  descriptions shall very binary defined as it 's can't be misunderstood by anyone and if it's used by many mentors who uses this rubric to correct the answer, they all shall get the same answer


For each scope/quality rubric item, include the following fields:
  - "criterion": What is being evaluated
  - "weight": integer weight on based on importance all weights must sum to 100 in scope and 100 in quality
  - "levels": a list of levels for the criterion (min is 0 and max is the weight itself), each with:
    -"description": a clear, binary description of the level
    -"grade_range": a tuple indicating the minimum and maximum score for that level

### Output Format (JSON only — no markdown or explanation):

{
  "Scope": [
    {
      "name": "Scope Criterion Name",
      "weight": 40,
      "levels": [
        {
          "description": "Level 1 description (lowest)",
          "range": [0, 0]
        },
        {
          "description": "Level 2 description",
          "range": [1, 20]
        },
        {
          "description": "Level 3 description (full score)",
          "range": [21, 40]
        }
      ]
    }
  ],
  "Quality": [
    {
      "name": "Quality Criterion Name",
      "weight": 25,
      "levels": [
        {
          "description": "Level 1 description (lowest)",
          "range": [0, 0]
        },
        {
          "description": "Level 2 description",
          "range": [1, 12]
        },
        {
          "description": "Level 3 description (full score)",
          "range": [13, 25]
        }
      ]
    }
  ]
}

Here is the task in JSON:

""" + json.dumps(
            task
        )
        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
            )

            raw_output = response.choices[0].message.content.strip()
            rubric_data = self._clean_model_output(raw_output)
            rubric_data = json.loads(rubric_data)

            if "Scope" not in rubric_data or "Quality" not in rubric_data:
                raise ValueError(
                    "Rubric must contain both 'Scope' and 'Quality' sections."
                )

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(rubric_data, f, indent=2, ensure_ascii=False)

            return rubric_data

        except json.JSONDecodeError as e:
            print("Rubric JSON Decode Error:", e)
            print("Raw Output:\n", raw_output)
            raise ValueError(f"Failed to parse rubric JSON: {e}")

        except Exception as e:
            print("OpenAI API or General Error:", e)
            raise ValueError(f"Failed to generate rubric: {e}")

    def _clean_model_output(self, text):
        text = text.strip()
        text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        text = re.sub(r"\n", "", text)
        text = re.sub(r"[\t\s]*$", "", text)
        text = re.sub(r",\s*}", "}", text)
        return text
