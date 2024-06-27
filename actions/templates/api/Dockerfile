# dev build
FROM public.ecr.aws/docker/library/node:current-alpine as development

EXPOSE 5005X # fix port

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN apk add git

RUN yarn --frozen-lockfile

COPY . .

RUN yarn build:{{___microservice_lower___}}

# prod build
FROM public.ecr.aws/docker/library/node:current-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN apk add git

RUN yarn install --production --frozen-lockfile

COPY . .

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 5005X # fix port

CMD ["node", "dist/apps/{{___microservice_lower___}}/main"]
