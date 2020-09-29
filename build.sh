#!/bin/bash

# Build Prod
cd api && npm i && ENV=production npm run build

# Build UI
cd ../ui && npm i && ENV=production npm run build

# Copy UI to Server
cp -R dist/* ../api/public