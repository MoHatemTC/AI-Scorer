import json
import streamlit as st
import os
from dotenv import load_dotenv
from skill_extraction_agent import SkillExtractionAgent
from task_details_agent import TaskDetailsAgent
from task_generation_agent import TaskGenerationAgent
from generate_rubric_agent import RubricGenerationAgent
from task_rubric_docx_agent import DocumentWriterAgent


load_dotenv()
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")


skill_agent = SkillExtractionAgent()
details_agent = TaskDetailsAgent()
task_agent = TaskGenerationAgent()
rubric_agent = RubricGenerationAgent()
doc_agent = DocumentWriterAgent()

def main():
    st.title(" AI Task Planning & Rubric Generator")
    uploaded_file = st.file_uploader(" Upload Transcription (.txt or .vtt)", type=["txt", "vtt"])

    if uploaded_file:
        transcription_text = uploaded_file.read().decode("utf-8")
        st.success(" Transcription loaded.")

        if st.button(" Extract Skills"):
            skills = skill_agent.run(transcription_text)
            st.session_state["skills"] = skills
            st.success(" Skills extracted!")
            st.subheader(" Extracted Skills")
            st.json(skills)

        if "skills" in st.session_state:
            skills = st.session_state["skills"]

            if st.button(" Generate Task Details"):
                task_details = details_agent.run(skills)
                st.session_state["task_details"] = task_details
                st.subheader(" Task Details")
                st.json(task_details)

            if st.button(" Generate Tasks"):
                tasks = task_agent.run(skills)
                st.session_state["tasks"] = tasks
                st.subheader(" Generated Tasks")
                st.json(tasks)

            if st.button(" Generate Rubrics"):
                tasks = st.session_state.get("tasks") or task_agent.run(skills)
                rubric = rubric_agent.run(tasks)
                st.session_state["rubric"] = rubric
                st.subheader(" Rubric")
                st.json(rubric)

            if st.button(" Export to Word Document"):
                # Reload from saved files 
                try:
                     with open("extracted_skills.json", "r", encoding="utf-8") as f:
                          skills = json.load(f)

                     task_details = details_agent.run(skills)
                     tasks = task_agent.run(skills)
                     rubric = rubric_agent.run(tasks)

                     with open("task_details.json", "w", encoding="utf-8") as f:
                       json.dump(task_details, f, indent=2, ensure_ascii=False)
                     with open("generated_tasks.json", "w", encoding="utf-8") as f:
                       json.dump(tasks, f, indent=2, ensure_ascii=False)
                     with open("rubric.json", "w", encoding="utf-8") as f:
                        json.dump(rubric, f, indent=2, ensure_ascii=False)

                     doc_agent.run()
                     st.success(" Word Document generated.")

                     with open("Task_and_Rubric_Document.docx", "rb") as f:
                           docx_bytes = f.read()

                     st.download_button(
                        label="⬇ Download Word Document",
                        data=docx_bytes,
                        file_name="Task_and_Rubric_Document.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )
                except Exception as e:
                   st.error(f" Failed to export document: {e}")

if __name__ == "__main__":
    main()
