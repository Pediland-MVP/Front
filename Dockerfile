FROM node:24.11.1-alpine

WORKDIR /app

COPY ./package*.json ./

RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

RUN npm run build
# || echo "Build failed" && exit 1

EXPOSE 3000
CMD ["npm", "start"]
