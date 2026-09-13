# 🛒 PaasMart User App

PaasMart User App is a modern, customer-facing e-commerce mobile application built with **React Native, Expo, and TypeScript**.

The application provides customers with a complete shopping experience — from account registration and product discovery to cart management, checkout, order tracking, wishlist, wallet, addresses, notifications, and customer support.

PaasMart is designed as part of a complete e-commerce ecosystem where customers can interact with products and services provided through the PaasMart platform.

---

##  About PaasMart

PaasMart is an e-commerce platform focused on providing customers with a simple, reliable, and user-friendly shopping experience.

The User App is the customer-facing application of the PaasMart ecosystem.

Customers can:

- Create and manage their account
- Browse available products
- Search and explore products
- View product details
- Add products to cart
- Manage wishlist
- Manage delivery addresses
- Complete checkout
- Place orders
- Track orders
- View order history
- Manage wallet
- Receive notifications
- Communicate through chat
- Request returns where applicable

The application communicates with the PaasMart backend through REST APIs.

---

#  Features

##  Authentication

PaasMart provides a secure authentication flow for customers.

### Registration

- Customer registration
- Full name validation
- Email validation
- Indian mobile number validation
- Password validation
- Confirm password validation
- Terms & Conditions acceptance
- Email verification using OTP
- Resend verification code
- Edit registration details before verification

### Login

- Email/password authentication
- Session management
- Authentication state persistence
- Protected application routes
- Logout support

---

##  Home

The home screen provides customers with a convenient starting point for shopping.

Features include:

- Product discovery
- Categories
- Featured products
- Product listings
- Search
- Quick navigation
- Personalized shopping experience

---

##  Product Discovery

Customers can explore products available on the platform.

Features include:

- Product listing
- Product details
- Product images
- Product pricing
- Product descriptions
- Product availability
- Product categories
- Search functionality
- Product filtering
- Product sorting

---

##  Shopping Cart

Customers can manage their shopping cart before placing an order.

Features include:

- Add product to cart
- Remove product from cart
- Increase/decrease quantity
- View cart items
- Calculate item totals
- Review cart before checkout

---

##  Wishlist

Customers can save products for later.

Features include:

- Add product to wishlist
- Remove product from wishlist
- View wishlist
- Quickly move between wishlist and product pages

---

##  Orders

Customers can manage and track their orders.

Features include:

- Place orders
- View order history
- View order details
- Order status
- Order tracking
- Order item information
- Order total information
- Return-related functionality where supported

---

##  Checkout

The checkout flow is designed to provide a simple purchasing experience.

The checkout process includes:

1. Review cart
2. Select delivery address
3. Review order
4. Select available payment option
5. Place order
6. View order confirmation

---

##  Address Management

Customers can manage their delivery addresses.

Features include:

- Add address
- Edit address
- Delete address
- Select default address
- Select delivery address during checkout

---

##  Wallet

The application includes wallet-related functionality for managing customer wallet information.

Possible functionality includes:

- View wallet balance
- View wallet transactions
- Use wallet balance where supported
- View transaction history

---

##  Notifications

Customers can receive application notifications.

Notifications can be used for:

- Order updates
- Order status changes
- Account-related information
- Shopping updates
- Important platform notifications

---

##  Customer Chat

PaasMart includes customer communication functionality.

Customers can communicate through the application's chat system where supported.

This can be used for:

- Customer support
- Order-related communication
- Seller/customer communication
- General assistance

---

#  Tech Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| React Native | Mobile application development |
| Expo | React Native development platform |
| TypeScript | Type-safe application development |
| Expo Router | File-based navigation |
| React Native Safe Area Context | Safe area handling |
| React Native APIs | Mobile UI and interaction |

---

## Development Tools

- Node.js
- npm
- Expo CLI
- Git
- GitHub
- VS Code

---

#  Application Architecture

The application follows a modular structure where different responsibilities are separated into dedicated folders.

```text
PaasMart User App
│
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   └── ...
│
├── assets/
│   └── Images, icons and static assets
│
├── public/
│   └── Public/static resources
│
├── scripts/
│   └── Development/build scripts
│
├── src/
│   ├── api/
│   │   ├── auth
│   │   ├── client
│   │   └── ...
│   │
│   ├── components/
│   │   ├── Button
│   │   ├── Card
│   │   ├── Input
│   │   ├── Checkbox
│   │   ├── Logo
│   │   └── ...
│   │
│   ├── theme/
│   │   ├── colors
│   │   ├── typography
│   │   └── responsive utilities
│   │
│   ├── utils/
│   │   └── Authentication/session utilities
│   │
│   └── ...
│
├── app.json
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
