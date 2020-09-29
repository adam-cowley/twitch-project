#!/bin/bash

# Build Prod
cd api && ENV=production npm run build

# Build UI
cd ../ui && ENV=production npm run build

# Copy UI to Server
cp -R dist/* ../api/public