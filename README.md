# SkinIQ AI Skincare Planner

An AI-powered skincare intelligence platform that personalizes skincare routines, assesses skin profiles, tracks daily habits, and monitors skin recovery. Features dedicated portals for Consumers, Skincare Consultants, Dermatologists, and Administrators.

## Architecture

*   **Backend**: FastAPI, MongoDB
*   **Frontend**: Vanilla JS (SPA architecture), CSS (Glassmorphism design)
*   **Deployment**: Docker & Docker Compose

## Features

1.  **Consumer App**: Intelligent routine generation, daily habit tracking (sleep, hydration, lifestyle, environment), skin profile assessments, and progress analytics.
2.  **Consultant Suite**: Client queue, client dossiers, and regimen prescription studio.
3.  **Dermatologist Dashboard**: Patient diagnostic triage, condition staging (e.g., Acne grading, Rosacea), and medical Rx titration with live contraindication alerts.
4.  **Admin Portal**: Telemetry, user RBAC (Role-Based Access Control) management, and regulatory compliance INCI monitoring.

## Local Development Setup

1.  Install dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  Run the application:
    ```bash
    python run.py
    ```

    *The application automatically mounts the frontend at `http://127.0.0.1:8000` and creates dummy database data on first launch.*

## Testing

Run tests using pytest:
```bash
cd backend
pytest tests/
```

## Docker Deployment (Production)

Deploy the full stack (FastAPI + MongoDB) using Docker Compose:

```bash
docker-compose up --build -d
```

The application will be available at `http://localhost:8000`.

### Logs & Monitoring

Application logs are streamed to stdout/stderr and written to `backend/skiniq_app.log`.

### Cloud Deployment (AWS / Render)

To deploy the Docker container to a cloud provider like **Render** or **AWS Elastic Beanstalk**, a `render.yaml` infrastructure-as-code file has been provided in the root directory.
1. Create a managed MongoDB instance (e.g., MongoDB Atlas).
2. Connect your GitHub repository to Render (or AWS).
3. Render will automatically detect the `render.yaml` and `Dockerfile` to build and deploy your application to the cloud.

### System Endpoints
- API Docs: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/api/health`

## Built-in Demo Credentials

*   **Consumer**: `user@skiniq.ai` / `Password123!`
*   **Consultant**: `consultant@skiniq.ai` / `ConsultantPass2026!`
*   **Dermatologist**: `derm@skiniq.ai` / `DermPass2026!`
*   **Administrator**: `admin@skiniq.ai` / `AdminPass2026!`
