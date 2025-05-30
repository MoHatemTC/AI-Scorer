import openai
import json
import re

class TaskGenerationAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model

    def run(self, skills_list, output_file="generated_tasks.json"):
        if not skills_list:
            return []

        prompt = f"""
You are an AI tutor.

Convert the following skills into structured tasks.

RULES:
1. One task per skill
2. Include:
   - Action verb (e.g. Implement, Build)
   - Tool (e.g. Python, sklearn)
   - Success metric (e.g. 90% accuracy)
3. Format EXACTLY like:
[
  {{
    "skill": "X",
    "task": "Task description here",
    "difficulty": "beginner/intermediate/advanced"
  }}
]

Skills:
{json.dumps(skills_list, indent=2)}

IMPORTANT:
Return ONLY valid JSON list. No explanations, no markdown.
"""
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800
            )

            raw_output = response.choices[0].message.content.strip()
            raw_output = re.sub(r"^```(json)?", "", raw_output)
            raw_output = re.sub(r"```$", "", raw_output)

            if "]" in raw_output:
                raw_output = raw_output[:raw_output.rfind("]")+1]

            tasks = json.loads(raw_output)

            for task in tasks:
                if not {"skill", "task", "difficulty"}.issubset(task.keys()):
                    raise ValueError(f"Incomplete task: {task}")

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(tasks, f, indent=2, ensure_ascii=False)

            return tasks

        except json.JSONDecodeError as e:
            print("JSON Parse Error:", e)
            print(" Raw Output:\n", raw_output)
            return []

        except Exception as e:
            print("Generation Error:", e)
            return []