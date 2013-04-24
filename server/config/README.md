# Configuring Vinz Clortho 

## Step N: Creating a Configuration File 

    > cd server/config
    > cp local.json-dist local.json

## Step N: Creating Public/Private Keypairs

You will need a public and private key pair to act as a 
[Persona IdP](https://developer.mozilla.org/en-US/docs/Persona/Implementing_a_Persona_IdP). 

    > openssl genrsa -out private-key.pem 2048
    > openssl rsa -in private-key.pem -pubout > public-key.pem
    

