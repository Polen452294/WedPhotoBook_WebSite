server {
    server_name fotobooktest24.ru;
    server_tokens off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 1m;

    location = /admin {
        return 308 /admin/;
    }

    location ^~ /admin/ {
        auth_basic "WedFotoBook admin";
        auth_basic_user_file /etc/nginx/wedfotobook.htpasswd;
        limit_req zone=wedfotobook_admin burst=10 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization "";
        proxy_set_header oai-authenticated-user-id "nginx:$remote_user";
        proxy_set_header oai-authenticated-user-email "admin@fotobooktest24.ru";
        proxy_set_header oai-authenticated-user-full-name "Administrator";
        proxy_set_header oai-authenticated-user-full-name-encoding "percent-encoded-utf-8";
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    location = /api/admin {
        auth_basic "WedFotoBook admin";
        auth_basic_user_file /etc/nginx/wedfotobook.htpasswd;
        limit_req zone=wedfotobook_admin burst=10 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization "";
        proxy_set_header oai-authenticated-user-id "nginx:$remote_user";
        proxy_set_header oai-authenticated-user-email "admin@fotobooktest24.ru";
        proxy_set_header oai-authenticated-user-full-name "Administrator";
        proxy_set_header oai-authenticated-user-full-name-encoding "percent-encoded-utf-8";
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    location ^~ /api/admin/ {
        auth_basic "WedFotoBook admin";
        auth_basic_user_file /etc/nginx/wedfotobook.htpasswd;
        limit_req zone=wedfotobook_admin burst=10 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization "";
        proxy_set_header oai-authenticated-user-id "nginx:$remote_user";
        proxy_set_header oai-authenticated-user-email "admin@fotobooktest24.ru";
        proxy_set_header oai-authenticated-user-full-name "Administrator";
        proxy_set_header oai-authenticated-user-full-name-encoding "percent-encoded-utf-8";
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization "";
        proxy_set_header oai-authenticated-user-id "";
        proxy_set_header oai-authenticated-user-email "";
        proxy_set_header oai-authenticated-user-full-name "";
        proxy_set_header oai-authenticated-user-full-name-encoding "";
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/fotobooktest24.ru/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/fotobooktest24.ru/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.fotobooktest24.ru;
    server_tokens off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    return 301 https://fotobooktest24.ru$request_uri;

    ssl_certificate /etc/letsencrypt/live/fotobooktest24.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fotobooktest24.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {


    listen 80;
    listen [::]:80;
    server_name fotobooktest24.ru www.fotobooktest24.ru;
    return 301 https://fotobooktest24.ru$request_uri;
}
