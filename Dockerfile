FROM node:24-alpine3.23 AS fnl_base_image
ENV PORT=8082
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Keep the app on the current patched base image instead of mutating the OS
# during build, which can fail in restricted CI environments.
COPY package.json package-lock.json ./
# Use lockfile-based install so image deps match audited repository state.
RUN npm ci --omit=dev --ignore-scripts

# Copy application files
COPY  --chown=node:node . .

EXPOSE 8082

CMD [ "node", "./bin/www" ]
