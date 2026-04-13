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

EXPOSE 3000

CMD ["npm", "run", "start"]