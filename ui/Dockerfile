FROM node:lts-alpine

ARG FOLDER=/ui

RUN mkdir -p $FOLDER

COPY . /ui/.

#CMD ["cd", "ui"]

WORKDIR $FOLDER

RUN npm install

EXPOSE 4173 

RUN npm run build

CMD ["npm", "run", "preview"]
