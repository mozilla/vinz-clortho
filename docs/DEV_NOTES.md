# Developer Notes #

Running Clortho without a web server...

This service **must** run on port 443. This is baked into the BrowserID Primary Protocol.

    openssl genrsa -out privatekey.pem 1024 
    openssl req -new -key privatekey.pem -out certrequest.csr 
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

