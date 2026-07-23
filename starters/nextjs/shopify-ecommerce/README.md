# Project Documentation: Next.js/Shopify Ecommerce Template

## Project Overview

This project is a headless Shopify ecommerce template built with **Next.js**, the **Shopify Storefront API**, and **Firebase Data Connect**. It provides a seamless front-end experience, optimized performance, and integration with Shopify's backend services.

---

## Pages Documentation

### 1. **Authentication Page (`/auth`)**

- **Purpose**: User authentication and account creation.
- **Features**:
  - Login and registration forms.
  - Integration with Shopify customer accounts via Shopify Storefront API.
- **Technical Details**:
  - Uses GraphQL mutations for `customerAccessTokenCreate` and `customerCreate`.

### 2. **Home Page (`/`)**

- **Purpose**: Landing page displaying featured products and collections.
- **Features**:
  - Dynamic product and collection rendering.
- **Technical Details**:
  - Queries: `collections` and `products` from Shopify Storefront API.

### 3. **Product Page (`/product/[handle]`)**

- **Purpose**: Displays detailed information for a single product.
- **Features**:
  - User reviews and ratings.
  - Review summaries generated using Google's Gemini AI
  - Semantic analysis of customer feedback
  - Real-time review aggregation
  - Product images, descriptions, variants, pricing, and inventory status.
  - Add-to-cart functionality.
  - Save variant selection to the URL search params for SEO and sharing purposes.
- **Technical Details**:
  - Query: `productByHandle` from Shopify Storefront API.
  - Mutation: `cartLinesAdd`.
  - Mutation: `cartCreate`.

### 4. **Cart Page (`/cart`)**

- **Purpose**: Shows the user’s shopping cart.
- **Features**:
  - List of added products, quantities, and prices.
  - Update and remove items from the cart.
- **Technical Details**:
  - Query: `cart` by cart ID.
  - Mutations: `cartLinesUpdate` and `cartLinesRemove`.

### 5. **Checkout Page (`/checkout`)**

- **Purpose**: Finalizes the purchase process.
- **Features**:
  - Displays cart summary and shipping details.
  - Redirects to Shopify's secure checkout.
- **Technical Details**:
  - Uses the checkout URL generated for the cart.

### 6. **Orders Overview Page (`/orders`)**

- **Purpose**: Displays a list of past orders for the authenticated user.
- **Features**:
  - Order summaries with statuses and total amounts.
- **Technical Details**:
  - Query: `customerOrders`.

### 7. **Order Detail Page (`/order/[id]`)**

- **Purpose**: Detailed view of a single order.
- **Features**:
  - Order items, shipping address, payment method, and status.
- **Technical Details**:
  - Query: `order` by ID.

### 8. **Category Page (`/category/[handle]`)**

- **Purpose**: Displays products under a specific category or collection.
- **Features**:
  - Paginated product listings.
  - Sorting and filtering options.
- **Technical Details**:
  - Query: `collectionByHandle`.

---

## Shopify Admin Documentation

### **Products**

- Manage product listings including descriptions, images, pricing, and inventory.
- Products added in the Shopify Admin will reflect dynamically on the front end.
- We can provide a CSV import of products to the Shopify Admin to help with the onboarding process.

### **Collections**

- Organize products into categories or groups for better navigation and display.

### **Orders**

- Manage customer orders, including fulfillment, cancellations, and refunds.

### **Users**

- Handle customer accounts and permissions for staff members.

---

## Shopify Storefront API Documentation

- **Authentication**:
  - Secure API calls using access tokens.
- **GraphQL Queries**:
  - `products`: Retrieves product data.
  - `collections`: Retrieves collection data.
  - `cart`: Fetches details about the shopping cart.
- **GraphQL Mutations**:
  - `cartLinesAdd`: Adds items to the cart.
  - `checkoutCreate`: Initializes the checkout process.
  - `customerCreate`: Creates a new customer account.

---

## Data Connect Documentation

### **Overview**

- Data Connect is integrated to enhance search capabilities using **vector search** and **AI**-powered data querying.

### **Vector Search**

- Improves search relevance and precision by using product embeddings.
- Examples:
  - Searching for "summer shoes" retrieves similar products based on semantic similarity.

### **AI Query Generation**

- The Firebase Data-Connect console includes an AI assistant to generate and optimize GraphQL queries and mutations.
- Examples:
  - Auto-generated queries for frequently searched terms or product categories.
  - AI-optimized mutations for dynamic user interactions.

### **GraphQL Queries and Mutations Used**

- **Queries**:
  - `searchProducts`: Retrieves products based on user input.
  - `searchCollections`: Fetches collections matching keywords.
- **Mutations**:
  - `cartLinesUpdate`: Updates cart item quantities.
  - `cartLinesRemove`: Removes items from the cart.

### Vector Search Capabilities

#### Product Search

- Name-based similarity search
- Description-based semantic search
- Review content similarity search

#### Implementation

---

## Technical Architecture

### Frontend

- Next.js 15.0.3
- React 18
- Tailwind CSS
- Headless UI Components

### Backend Services

- Shopify Storefront API
- Firebase Data Connect
- Google Generative AI (Gemini)

### Authentication Flow

- Customer token-based authentication
- Secure session management using cookies
- Activation process for new accounts

---

## Development Setup

### Prerequisites

- Node.js 20+
- Firebase CLI
- Shopify Partner Account

### Environment Variables

Required environment variables:

- SHOPIFY_STORE_DOMAIN
- SHOPIFY_STOREFRONT_ACCESS_TOKEN
- FIREBASE_API_KEY
- GOOGLE_API_KEY (for Gemini AI)

---

## Error Handling

### Authentication Errors

- Invalid credentials
- Account activation failures
- Session expiration

### API Errors

- Shopify API rate limits
- Data Connect timeout handling
- Vector search limitations

---
