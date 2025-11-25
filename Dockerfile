FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4173
CMD ["sh", "-c", "npm run build && npm run preview -- --host 0.0.0.0 --port 4173"]