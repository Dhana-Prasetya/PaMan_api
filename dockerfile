# Step 1: Use a small, stable version of Node
FROM node:20-alpine

# Step 2: Set the folder where our app lives inside the container
WORKDIR /paman_api

# Step 3: Copy only package files first (Performance Trick!)
# This allows Docker to cache your "npm install" layer.
COPY package*.json ./

# Step 4: Install dependencies
# We use 'npm ci' for faster, reliable installs in Docker
RUN npm install

# Step 5: Copy the rest of your code
COPY . .

# Step 6: Tell Docker which port your app runs on
ENV BACKEND_RUNNING_PORT=5000

EXPOSE 5000

# Step 7: How to start the app
CMD ["nodemon", "index.js"]