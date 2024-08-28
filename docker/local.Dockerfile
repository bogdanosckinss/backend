FROM node:16

WORKDIR /src

COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/

COPY . .

RUN yarn install
# RUN npx prisma db push
RUN yarn prisma generate

CMD [ "yarn", "start:dev" ]
