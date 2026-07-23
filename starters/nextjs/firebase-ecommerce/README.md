# Firebase E-Commerce Project

This project is a Firebase-based e-commerce application designed for developers to bootstrap their e-commerce projects. Below is the documentation to help you set up, provision, and maintain the application.

## Overview

The application provides a quick and easy to use shopping experience with features like:

- Firebase Authentication for user sign-up, sign-in, and management.
- Product and collection management of assets with Firebase Storage.
- Real-time database connections using Firebase Data Connect.
- Checkout and payment processing through Stripe.
- Dynamic pages for collections, products, and orders.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Environment Variables](#environment-variables)
3. [Application Features](#application-features)
4. [Provisioning Steps](#provisioning-steps)
5. [Support and Maintenance](#support-and-maintenance)

## Setup and Configuration

### Firebase Setup

#### Firebase Auth

1. Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Email/Password Authentication**.
3. Replace the relevant commented-out environment variables in `apphosting.yaml`
   with your firebase config.

#### Firebase Data Connect

1. Install the **Firebase Data Connect** extension for VS Code.
2. Create a new Data Connect instance and service.
3. Set up billing for the Firebase project.
4. Switch to the Blaze plan.
5. Modify `dataconnect/dataconnect.yaml` to specify `serviceId`, `location`,
   `schema.datasource.postgresql.database` and
   `schema.datasource.postgressql.cloudSql.instanceId`
6. Deploy the schema, queries, and mutations to production.

#### Firebase Storage

1. Create a new Storage bucket.
2. Use the bucket to store images for products and collections.

#### Firebase App Hosting

1. Connect the Firebase app to your GitHub repository.
2. Create a new backend for the application, but do not deploy yet.
   We need to set up environment variables first for the app to work.

### Stripe Setup

1. Create a new Stripe account.
2. Follow the instructions in apphosting.yaml to create the
   public and private keys for your stripe application.
3. Create a webhook that listen to "Events on your account" at
   <your domain>/api/stripe/webhook that receives at least
   the following events: `payment_intent.succeeded`, `payment_intent.failed`,
   `charge.succeeded`, `charge.updated`.
2. Add API keys (Publishable and Secret) to `.env.local`.
3. Set up a webhook endpoint in the Firebase project.
4. Add the webhook secret to `.env.local`.
5. Deploy webhook configurations using the Firebase CLI.
6. Customize the webhook to handle required Stripe events.

## Environment Variables

The following environment variables must be configured in `apphosting.yaml`
(there are comments for where to find these values)

- **Firebase Config**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
- **Stripe Config**: `NEXT_PUBLIC_STRIPE_PUB_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Google/Gemini API Key**: `GOOGLE_API_KEY`

## Deploy
Once you have set up Stripe, Data Connect, and configured your App Hosting environment, it's time to deploy!
If you have automatic rollouts enabled, simply push your changes. Otherwise, after pushing, go to the
Firebase console and click "Create Rollout".

## Application Features

### Homepage

- Displays featured collections with links to individual pages.
- Includes a header with navigation links, a search bar, and user/cart icons.
- Showcases product highlights and promotions.

### Product Page

- Displays product details including name, description, price, images, and options (e.g., size, color).
- Features a reviews section and a cart addition button.

### Collection Page

- Lists collection details such as name, description, and products.
- Displays products in a grid layout.

### Cart

- Shows cart items, address input, and a checkout button.
- Items are displayed with name, price, and image.
- Enables checkout once an address is added.

### Checkout

- Handles payment through Stripe Checkout.
- Displays an order summary with total price.
- Redirects to the orders page upon successful payment.

### Orders

- Lists user orders with details like date, tracking, total price, and order ID.
- Allows users to view detailed order information.

### Authentication

- Managed via Firebase Auth.
- Supports user sign-up, sign-in, and sign-out.
- Authenticated users can access order history and complete checkouts.

## Provisioning Steps

1. Follow the Firebase and Stripe setup instructions.
2. Deploy the application using Firebase CLI.
3. Ensure all environment variables are correctly configured.

## Support and Maintenance

- **Firebase Data Connect**: Update schemas and queries as needed.
- **Stripe Webhooks**: Monitor and update event handling.
- **Secrets Management**: Rotate secrets periodically and update `.env.local`.
- **User Support**: Monitor Firebase Auth logs for user-related issues.
- **Storage**: Regularly review storage usage and optimize image sizes.

## Additional Notes

- Ensure that billing is enabled for all Firebase features.
- Test webhook integrations thoroughly before deploying.
- Keep environment variables secure and avoid hardcoding secrets.

For further support or questions, refer to the project documentation or contact the development team.

## Local Development

To run this project locally, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/username/firebase-ecommerce.git
   ```
2. Move into the project directory:
   ```
   cd firebase-ecommerce
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Fill in `apphosting.yaml` as guided by the comments.
5. Initialize the firebase emulator suite with `firebase init emulators`. You may
   create an `apphosting.emulator.yaml` if you choose to use different configurations
   during local development or you can test against your production config.
5. Start the emulator
   ```
   firebase emulators:start
   ```
6. Open the application in your browser at:
   ```
   http://localhost:5002
   ```

---

## Contributing

We welcome contributions to this project! Before making any contributions, please read and follow these guidelines:

1. Create an issue describing your proposed change or feature request.
2. Fork the repository and create a new branch for your changes.
3. Ensure your code adheres to the existing style and linting rules.
4. Write or update tests if applicable.
5. Submit a pull request (PR) following the PR template (if you have one).
6. Once approved, your changes will be merged into the main branch.

---

## License and Credits

• This project is licensed under the [MIT license](LICENSE) (or adjust as needed for your license).  
• Built with:

- [Next.js](https://nextjs.org/) for the React framework
- [Firebase](https://firebase.google.com/) for authentication, storage, and hosting
- [Stripe](https://stripe.com/) for payment processing
- [Google Generative AI](https://developers.generativeai.google/) for review summaries

Feel free to add acknowledgments or shout-outs to libraries or contributors here.

---

## Security and Firebase Rules

For an e-commerce app handling user data and transactions, security is critical:

1. Make sure you enable the correct Firebase security rules for Firestore/RealtimeDatabase and Storage.
2. Keep your environment variable secrets private. Do not commit them to Git.
3. Rotate your Firebase, Stripe, and Google API keys periodically.
4. Implement user authentication checks (via Firebase Auth) before reading or writing sensitive data.

Reference:  
• [Firebase Rules Documentation](https://firebase.google.com/docs/rules)  
• [Firestore Security Rules Examples](https://firebase.google.com/docs/firestore/security/get-started)

---

## Additional Integrations (Optional)

If you plan to integrate other services or need advanced features, you can add details here. For example:

• Analytics: Google Analytics or Segment usage.  
• Shipping Providers: FedEx/UPS/Shippo integrations.  
• Automated Emails: Transactional emails with SendGrid/Mailchimp.  
• Domain Config: Steps to configure custom domains in Firebase Hosting.

---

## Project Structure

Below is a high-level overview of the main directories and their purposes:

```bash
firebase-ecommerce/
├─ dataconnect/             # Firebase Data Connect migrations and schemas
├─ src/
│  ├─ app/                  # Next.js app router: includes pages, API routes
│  ├─ components/           # Reusable React components (UI, sections, etc.)
│  ├─ lib/                  # Utility functions and helpers
│  └─ ...                   # Other feature-based directories
├─ .env.local               # Environment variables (ignored by Git)
├─ package.json
├─ README.md                # Documentation
└─ ...
```
