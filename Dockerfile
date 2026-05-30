FROM python:3.11-slim

WORKDIR /app

# Install uv (blazing fast Rust-based Python package installer)
RUN pip install --no-cache-dir uv

# Copy backend requirements and install dependencies with uv (solves pip hanging issue)
COPY backend/requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# Copy the entire backend app
COPY backend/ .

# Railway injects $PORT dynamically
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
