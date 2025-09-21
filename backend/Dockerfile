# Use official Node.js image
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Use PORT from environment variable (Render will set this)
EXPOSE $PORT
CMD ["node", "index.js"]
