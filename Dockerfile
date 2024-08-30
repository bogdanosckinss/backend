FROM node:20

WORKDIR /src

COPY . .

RUN yarn install
# RUN npx prisma db push
RUN yarn prisma generate

EXPOSE 3000

CMD [ "yarn", "start" ]
