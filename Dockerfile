FROM node:22-alpine AS builder
WORKDIR /app

# copy files package.json & package-lock.json
COPY package*.json ./

# install deps
RUN npm ci --only=production

FROM node:22-alpine
WORKDIR /app

# copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# copy source code
COPY . .

ENV SCANHAND_CORS=http://localhost:3000
ENV SCANHAND_YOO_SHOP_ID=1234
ENV SCANHAND_YOO_SECRET_KEY=1234
ENV SCANHAND_YOO_REDIRECT=https://scanhand.ru
ENV SCANHAND_MONGODB_URI=mongodb://127.0.0.1:27017
ENV SCANHAND_MONGODB_USER=user
ENV SCANHAND_MONGODB_PASS=pass

EXPOSE 3100

CMD ["npm", "run", "start"]