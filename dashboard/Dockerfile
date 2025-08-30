FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the app
RUN npm run build

# Expose vite preview port
EXPOSE 4173

# Run vite preview
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]