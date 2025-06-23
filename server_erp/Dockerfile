FROM node:20-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install

COPY . .

EXPOSE 7000

CMD [ "node", "index.js" ]