import openai
import json
import re

class TaskDetailsAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model

    def run(self, skills_list, output_file="task_details.json", batch_size=5):
        full_output = []

        for i in range(0, len(skills_list), batch_size):
            batch = skills_list[i:i + batch_size]

            prompt = f"""
You are a technical project assistant.

Generate DETAILED learning task descriptions for ALL of the following skills.

Each result must include:
- Objective
- Tools/Tech Stack
- Input/Dataset
- Expected Output
- Estimated Duration (in hours)

Return JSON in this format:
[
  {{
    "skill": "X",
    "details": {{
      "objective": "...",
      "tools": "...",
      "input": "...",
      "output": "...",
      "duration": "..."
    }}
  }},
  ...
]

IMPORTANT:
- Cover every skill in the input list.
- Return ONLY valid JSON.
- No extra explanation, no markdown.
Skills:
{json.dumps(batch, indent=2)}
"""
            try:
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1500
                )

                result = response.choices[0].message.content.strip()
                result = re.sub(r"^```(json)?", "", result)
                result = re.sub(r"```$", "", result)

                if "]" in result:
                    result = result[:result.rfind("]")+1]

                parsed = json.loads(result)
                full_output.extend(parsed)

            except json.JSONDecodeError as e:
                print(f"JSON Error in batch {i//batch_size+1}:", e)
                print("Raw output:\n", result)
            except Exception as e:
                print(f"General Error in batch {i//batch_size+1}:", e)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(full_output, f, indent=2, ensure_ascii=False)

        return full_output