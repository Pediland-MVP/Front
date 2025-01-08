FROM node:18

WORKDIR /app

COPY ./package*.json ./

RUN npm install

# Copy the rest of the application files
COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
