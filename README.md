# SmartFarmer

Responsive Next.js dashboard prototype for a farmer-focused AWS application.

```powershell
npm install
npm run dev
```

## AWS service map

- Amplify + CloudFront + Route 53: frontend hosting, CDN and DNS
- Cognito: farmer login and registration
- API Gateway + Python Lambda: application APIs
- DynamoDB: profiles, diary and billing records
- S3: crop images, documents, knowledge sources and invoice PDFs
- Bedrock + Knowledge Bases: AI assistant, crop analysis and scheme search
- Transcribe + Polly + Translate: regional-language voice interaction
- Location Service: farm maps
- SES + End User Messaging + EventBridge: email, SMS and scheduled alerts
- Secrets Manager + IAM + WAF + CloudWatch: secrets, permissions, protection and monitoring
- External APIs via Lambda: weather and mandi prices

The dashboard currently uses sample data. Provision cloud resources only after choosing an AWS region, domain, notification origination, Bedrock model access, and external weather/market providers.

## GitHub-ready setup

This repository is safe to publish: generated files, local environment files, test artifacts, and deployment archives are ignored. The GitHub Actions workflow runs `npm ci` and `npm run build` for every push and pull request.

Copy `.env.example` to `.env.local` only for local API overrides. Never commit `.env.local`, AWS credentials, API keys, Cognito tokens, or Razorpay secrets.

## Security and credentials

- The browser never receives Google Weather, data.gov.in, AWS, or Razorpay secret keys.
- Lambda retrieves provider credentials from AWS Secrets Manager.
- Razorpay’s publishable order key may be sent to the checkout browser; its secret remains in Secrets Manager.
- Farmers and customers authenticate with Cognito email and password. New accounts receive a one-time email verification code before their first sign-in.
- Passwords are submitted directly to Cognito through the authentication API and are never stored by SmartFarmer.
- End users need no AWS CLI, no API key, and no cloud credentials. The AWS CLI is only needed by administrators to deploy or operate infrastructure.
- Dynamic features still require backend APIs: login, weather, mandi prices, listings, image upload, payments, invoices, and AI assistance.

## Live AWS deployment

- Website: https://main.d3uorrhappvzqr.amplifyapp.com
- API: https://2cd9i6o6g8.execute-api.ap-south-1.amazonaws.com
- Health check: https://2cd9i6o6g8.execute-api.ap-south-1.amazonaws.com/health
- Weather: https://2cd9i6o6g8.execute-api.ap-south-1.amazonaws.com/weather?lat=22.7196&lng=75.8577
- Region: `ap-south-1`
- CloudFormation stack: `smart-farmer`
- Infrastructure template: `infra/template.yml`

The stack is repeatable with:

```powershell
aws cloudformation deploy --template-file infra/template.yml --stack-name smart-farmer --capabilities CAPABILITY_IAM
```

Google Weather and data.gov.in credentials are stored only in the `smart-farmer/external-apis` AWS secret. The live dashboard accesses them through Lambda; it does not expose them to the browser.

Route 53 requires a domain name. SES sender verification and SMS production origination require real sender details and account approval. Bedrock Knowledge Base ingestion requires agricultural source documents and a selected vector store; the S3 knowledge source and Bedrock runtime access are provisioned, but an empty paid vector index is intentionally not created.
