FROM node:24-alpine3.23 AS fnl_base_image
ENV PORT=8082
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Patch Alpine OS packages in the image layer.
RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
# Use lockfile-based install so image deps match audited repository state.
RUN npm ci --omit=dev --ignore-scripts

# Copy application files
COPY  --chown=node:node . .

EXPOSE 8082

CMD [ "node", "./bin/www" ]
