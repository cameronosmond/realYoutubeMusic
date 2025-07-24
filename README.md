# Youtube Music Playlist Manager

Allows users to view their songs in their Youtube Music playlists by artist, displaying
the songs and which playlists they are in.

Live App: [https://d1xnp62o6g2k4x.cloudfront.net](https://d1xnp62o6g2k4x.cloudfront.net)

## Tech Stack

- React + Vite (frontend)
- AWS Lambda + API Gateway (backend)
- DynamoDB (database)
- S3 + CloudFront (hosting)

## Features

- User login with Google OAuth2 to access YouTube data
- Store user id and refresh token securely in DynamoDB
- Static React frontend hosted on S3
- Serverless backend with Lambda functions

## Getting Started

### Installation/Configuration

1. Clone the repo  
   `git clone https://github.com/yourusername/yourrepo.git`

2. Install dependencies

   - `npm install`
   - `cd frontend && npm install`
   - `cd lambdas && npm install`

3. Configure lambda functions

   - `cd lambdas`
   - `zip -r getSongsByArtist.zip getSongsByArtist.mjs node_modules package.json`
   - `zip -r googleSignIn.zip googleSignIn.mjs node_modules package.json`
   - Go to AWS console and make two separate lambda functions:
     googleSignIn and getSongsByArtist
   - Upload the zip files, getSongsByArtist.zip and googleSignIn.zip to their respective lambda functions
   - Ensure handler in AWS matches the file name for that function,
     i.e. getSongsByArtist.handler, googleSignIn.handler
   - Under Configuration->General configuration:
     googleSignIn - make Timeout 10sec,
     getSongsByArtist - make Timeout 1min and Memory 256MB
   - Under Configuration->Environment variables:
     for both functions, add environment variables GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET

4. API Gateway

   - Create HTTP API
   - Add POST endpoints for getSongsByArtist and googleSignIn lambda functions

5. DynamoDB

   - Create table with partition key 'user_id' and column 'refresh_token'

6. Google Cloud

   - Create a new project
   - Create OAuth2.0 Client ID, store this Client ID and Client secret now as
     you won't be able to access the secret later
   - Add http://localhost to the client id under Authorized Javascript Origins

7. Frontend Environment Variables

   - `cd frontend && touch .env`
   - Add variables:
     VITE_API_URL: API Gateway Invoke URL
     VITE_GOOGLE_CLIENT_ID: Google OAuth Client ID

8. Final Notes
   - Ensure roles, permissions, CORS, and regions are properly configured in AWS to
     allow interactions between the different services, using localhost when developing and
     changing the correct production url when deployed
   - Ensure in Google Cloud everything has been configured properly for this project

### Running Locally

- Start frontend dev server  
  `npm run dev --prefix frontend`

### Deployment

1. S3 & Cloudfront

   - `cd frontend && npm run build` to create dist/ which stores static files
   - Create S3 bucket, uncheck the block all public access option
   - Go to Properties tab, scroll down to static website hosting, enable it and set index and error documents to be index.html
   - Go to Objects tab, upload all files inside dist/, not the folder itself
   - Go to Permissions tab, edit the Bucket policy to be
     `{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Sid": "AllowPublicRead",
         "Effect": "Allow",
         "Principal": "*",
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::my-frontend-app/*"]
      }
   ]
}`
   - Go to Cloudfront and create distribution for this S3 bucket

2. Google Cloud
   - Add url obtained from Cloudfront to the client id under Authorized Javascript Origins
   - Add url/auth/callback to the client id under Authorized redirect URIs
   - Follow directions https://support.google.com/cloud/answer/13461325?sjid=8080830732266021786-NA for submitting app for verification

## Folder Structure

- `/frontend` — React + Vite code
- `/lambdas` — Lambda functions
- `/infra` — deployment scripts and configs

## Environment Variables

- VITE_API_URL | URL of your deployed API Gateway
- VITE_GOOGLE_CLIENT_ID | Google OAuth Client ID
- GOOGLE_CLIENT_ID | Google OAuth Client ID
- GOOGLE_CLIENT_SECRET | Google OAuth Client Secret

## License

This project is licensed under the MIT License.
