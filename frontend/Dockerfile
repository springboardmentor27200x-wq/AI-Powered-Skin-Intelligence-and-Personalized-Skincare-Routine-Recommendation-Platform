FROM node:20-alpine

WORKDIR /app

# Copy dependencies manifest
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
