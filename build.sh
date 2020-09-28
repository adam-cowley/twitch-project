#!/bin/bash

cd api && npm run build

cd ../ui && ENV=production npm run build

cp -R dist/* ../api/dist/public