import json
from openai import OpenAI
from dotenv import load_dotenv


load_dotenv()

# I made that change to fix incompatibility with the latest OpenAI library
openai = OpenAI()


class SkillExtractionAgent:
    def __init__(self, model="gpt-3.5-turbo"):
        self.model = model

    def run(self, transcription_text, output_file="extracted_skills.json"):
        prompt = f"""
Analyze this transcription and extract domain-specific skills following these rules:
1. Identify technical skills and domain-specific concepts
2. Exclude general conversation phrases
3. Remove duplicates and variations
4. Return ONLY a JSON array of skill strings

Transcription:
{transcription_text}

JSON Output:
"""
        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500
            )
            result = response.choices[0].message.content.strip()

            if result.startswith("```json"):
                result = result[7:-3].strip()
            elif result.startswith("```"):
                result = result[4:-3].strip()

            skills = json.loads(result)

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(skills, f, indent=2, ensure_ascii=False)

            return skills

        except Exception as e:
            print("SkillExtractionAgent Error:", e)
            return []
