FROM node:17-slim

RUN apt-get update && \
apt-get install -y sox libsox-fmt-mp3
# libsox-fmt-all: to all audio formats

WORKDIR /spotify-radio/

COPY package*.json ./

RUN npm ci --silent

COPY . .

USER node

CMD npm run dev