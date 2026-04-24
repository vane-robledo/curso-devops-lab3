FROM node:24 AS build  

WORKDIR /app

COPY ./ ./

RUN npm install

RUN npm run build

FROM node:24-alpine

WORKDIR /usr/app

COPY --from=build /app/dist /usr/app/dist
COPY --from=build /app/package*.json /usr/app/
RUN npm install --only=production

EXPOSE 3000

CMD [ "node", "dist/main.js" ]