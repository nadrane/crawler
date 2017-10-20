FROM node:8.7.0-alpine

WORKDIR /app

run apk update
run apk add git

RUN git clone https://github.com/nadrane/crawler
RUN npm i

EXPOSE 80
EXPOSE 443

RUN npm start