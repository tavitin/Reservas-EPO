#!/bin/sh
# Write nginx config with a placeholder, then substitute PORT at runtime
cat > /etc/nginx/conf.d/default.conf << 'CONF'
server {
    listen PORTPLACEHOLDER;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
CONF
sed -i "s/PORTPLACEHOLDER/${PORT:-80}/" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
