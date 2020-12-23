FROM node:latest
WORKDIR /usr/app
COPY . .
# RUN npm install -g npm
RUN npm ci --only=production
EXPOSE 8080
CMD ["npm", "start"]