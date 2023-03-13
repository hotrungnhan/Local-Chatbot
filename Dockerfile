FROM node:lts-alpine
WORKDIR /app

COPY . .

RUN npm i

CMD npm run start
