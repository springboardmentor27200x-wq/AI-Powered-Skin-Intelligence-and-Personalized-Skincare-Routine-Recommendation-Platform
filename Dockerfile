FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY run.py /app/run.py
COPY setup_db.py /app/setup_db.py

# Set environment variables
ENV PYTHONPATH=/app/backend

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "run.py"]
