FROM node:8.7.0-alpine

WORKDIR /app

run apk update && apk add git

RUN git clone https://github.com/nadrane/crawler && npm i

EXPOSE 80 443

WORKDIR crawler

RUN npm i
RUN npm start