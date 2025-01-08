FROM node:18

WORKDIR /app

COPY ./package*.json ./

RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

RUN npm run build || echo "Build failed"

EXPOSE 3000
CMD ["npm", "start"]

