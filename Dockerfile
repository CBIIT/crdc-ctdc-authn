FROM node:24-alpine3.23 AS fnl_base_image
ENV PORT=8082
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Upgrade npm to latest version to fix bundled vulnerabilities
RUN npm install -g npm@11.14.1

COPY package.json ./
# Use npm install instead of npm ci to apply npm overrides for transitive dependency CVE fixes
RUN npm install --omit=dev --ignore-scripts

# Copy application files
COPY  --chown=node:node . .

EXPOSE 8082

CMD [ "node", "./bin/www" ]
