FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

COPY . .


EXPOSE 5173

CMD [ "npm", "run", "dev", "--", "--host", "0.0.0.0"]