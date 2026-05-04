FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Command will be overridden in docker-compose.yml
CMD ["python", "dock.py"]