# Use the official Python base image with the desired version
FROM python:3.11

# Set the working directory
WORKDIR /backend

COPY requirements.txt /backend/requirements.txt

# Install packages
RUN pip install -r requirements.txt

# Copy the project files into the container
COPY ./src /backend

# Expose any necessary ports
EXPOSE 7860

# Start the application
CMD ["python", "main.py"]