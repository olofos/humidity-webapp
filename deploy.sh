#/bin/sh
npm run build && ssh pi@humidity-gateway.local 'cd api-server; rm -r public' && scp -r build/ pi@humidity-gateway.local:/home/pi/api-server/public/
