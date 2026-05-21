# Task File: Consulta Médica & Healthcare (🩺) Module

This task list covers implementing clinical intake and medical summary structures.

## 🛠️ Objectives
- Map medical markers (Sintoma, Diagnóstico, Prescrição, Alergia, Retorno).
- Establish AI guidelines for clinical intake forms.
- Ensure strict privacy protocols for patient data handling.

---

## 📋 Task Details

### Task MEDICAL-1: Clinical Config and Fields
- **Objective:** Secure standard metadata: Patient Ref (anonymous/ID), Consultant, Specialty, Primary Reason.
- **Buttons Configured:** Sintoma, Prescrição, Diagnóstico, Retorno, Solicitar Exame, Alergia, Comentário Clínico.

### Task MEDICAL-2: Clinical Prompt Templates
- **Objective:** Configure prompt structures mapping transcripts to clinical soap notes (Subjective, Objective, Assessment, Plan).
- **Format Schema:**
  ```markdown
  - **Sintomas Relatados:** List of symptoms with exact timestamps.
  - **Hipótese Diagnóstica:** Key diagnosis.
  - **Plano Executivo:** Medication schedules, return date, exams ordered.
  ```

### Task MEDICAL-3: Privacy Safeguards
- **Objective:** Verify zero permanent server retention; wipe active audio blobs directly after secure processing.
