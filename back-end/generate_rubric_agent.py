import json
import re

from openai import OpenAI

# I made that change to fix incompatibility with the latest OpenAI library
openai = OpenAI()

class RubricGenerationAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model

    def run(self, task_list, output_file="rubric.json"):
        if not task_list or not isinstance(task_list, list):
            print("No valid task provided.")
            return []

        task = task_list[0]

      
        prompt = f"""
You are an expert evaluator building a binary scoring rubric for an AI grading system.

You will receive a task that includes:
- A title
- A description
- A list of functional requirements

Your job is to generate a rubric that can be used to **automatically score** a student's solution.

### Rubric Guidelines:
- The rubric must be structured into two sections:
  1. "Scope" — covering **functional requirements** (what the student was asked to implement).
     - Focus on whether each required feature exists or not.
  2. "Quality" — covering **non-functional aspects** such as:
     - code clarity
     - testing
     - maintainability
     - design and UX
     - best practices
     - performance
     - error handling

- For each rubric item, include the following fields:
  - "criterion": What is being evaluated (short, clear)
  - "priority": "High", "Medium", or "Low"
  - "penalty_points": Based on priority (High = 10, Medium = 5, Low = 2)

- You must also include:
  - A field called "max_score": the total sum of all penalty points
  - A field called "passed_score": the sum of penalty points for items that passed (pass_fail = 1)
  - A field called "final_score": calculated as (passed_score / max_score) * 100 (integer %)

### Output Format (JSON only — no markdown or explanation):

{{
  "Scope": [...],
  "Quality": [...],
  "max_score": INT,
  "passed_score": INT,
  "final_score": INT
}}

### Notes:
- Only base rubric criteria on what's in the task.
- Do NOT invent features or vague criteria.
- Infer reasonable quality expectations.
- Be strict: if a feature is missing, it should fail.

Here is the task in JSON:

{json.dumps(task)}
"""

        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500
            )

            raw_output = response.choices[0].message.content.strip()
            rubric_data = self._clean_model_output(raw_output)
            rubric_data = json.loads(rubric_data)

            if 'Scope' not in rubric_data or 'Quality' not in rubric_data:
                raise ValueError("Rubric must contain both 'Scope' and 'Quality' sections.")

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(rubric_data, f, indent=2, ensure_ascii=False)

            return rubric_data

        except json.JSONDecodeError as e:
            print("Rubric JSON Decode Error:", e)
            print("Raw Output:\n", raw_output)
            return []

        except openai.error.OpenAIError as e:
            print("OpenAI API Error:", e)
            return []

        except Exception as e:
            print("General Error:", e)
            return []

    def _clean_model_output(self, text):
        text = text.strip()
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        text = re.sub(r'\n', '', text)
        text = re.sub(r'[\t\s]*$', '', text)
        text = re.sub(r',\s*}', '}', text)
        return text
