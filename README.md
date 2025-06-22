# Youtube Music Playlist Manager

Allows users to filter their songs in their Youtube Music playlists by artist, and create a separate playlist with just these filtered songs by said artist.

## Tech Stack

- React + Vite (frontend)
- AWS Lambda + API Gateway (backend)
- DynamoDB (database)
- S3 + CloudFront (hosting)

## Features

- User login with Google OAuth to access YouTube data
- Store user tokens and data securely in DynamoDB
- Static React frontend hosted on S3
- Serverless backend with Lambda functions

## Getting Started

### Prerequisites

- Node.js and npm installed
- AWS CLI configured
- Google API credentials (Client ID and Secret)

### Installation

1. Clone the repo  
   `git clone https://github.com/yourusername/yourrepo.git`

2. Install frontend dependencies  
   `cd frontend && npm install`

3. Setup environment variables

- Copy `.env.example` to `.env` in the root  
- Fill in your API URLs and secrets in `.env`

### Running Locally

- Start frontend dev server  
  `npm run dev --prefix frontend`

- Backend: Use AWS Lambda test or local mocks (TBD)

## Deployment

- Build frontend and deploy to S3 (`npm run build` + s3-deploy.sh)  
- Deploy Lambda functions using AWS CLI or scripts  
- Configure API Gateway routes

## Folder Structure

- `/frontend` — React + Vite code  
- `/backend` — Lambda functions  
- `/infra` — deployment scripts and configs

## Environment Variables

VITE_API_URL      | URL of your deployed API Gateway  
GOOGLE_CLIENT_ID  | Google OAuth Client ID            
GOOGLE_CLIENT_SECRET | Google OAuth Client Secret      

## License

This project is licensed under the MIT License.

