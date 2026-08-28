FROM node:24-alpine3.24 AS fnl_base_image
ENV PORT=8082
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json ./
# Install production dependencies, then remove npm from the immutable runtime
RUN npm install --omit=dev --ignore-scripts \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && test ! -e /usr/local/lib/node_modules/npm \
    && ! command -v npm \
    && ! command -v npx

# Copy application files
COPY --chown=node:node . .

EXPOSE 8082

CMD ["node", "./bin/www"]
