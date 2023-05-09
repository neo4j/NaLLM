# Use base shared Python image
FROM shared:latest

# Create a folder
RUN mkdir -p /use_cases/kg_chat/backend/src

# Set the working directory
WORKDIR /use_cases/kg_chat/backend/src

COPY requirements.txt /use_cases/kg_chat/backend/src/requirements.txt

# Install packages
RUN pip install -r requirements.txt

# Copy the project files into the container
COPY ./src /use_cases/kg_chat/backend/src/

# Expose any necessary ports
EXPOSE 7860

# Start the application
CMD ["python", "main.py"]