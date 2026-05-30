FROM python:3.11-slim

WORKDIR /app

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend app
COPY backend/ .

# Railway injects $PORT dynamically
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
