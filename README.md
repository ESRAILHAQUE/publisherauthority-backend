# Publisher Authority Backend

A TypeScript-based backend API built with Node.js, Express, and Mongoose.

## Features

- ✅ TypeScript for type safety
- ✅ Express.js for API routing
- ✅ Mongoose for MongoDB integration
- ✅ ESLint for code quality
- ✅ Nodemon for development
- ✅ Environment variable configuration

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts              # Database configuration
│   ├── models/
│   │   ├── User.ts            # User model
│   │   ├── Website.ts         # Website model
│   │   ├── Order.ts           # Order model
│   │   └── Payment.ts         # Payment model
│   ├── routes/
│   │   ├── authRoutes.ts      # Authentication routes
│   │   ├── userRoutes.ts      # User routes
│   │   ├── websiteRoutes.ts   # Website routes
│   │   ├── orderRoutes.ts     # Order routes
│   │   └── paymentRoutes.ts   # Payment routes
│   └── server.ts              # Main server file
├── dist/                      # Compiled JavaScript (generated)
├── .eslintrc.json            # ESLint configuration
├── tsconfig.json             # TypeScript configuration
├── nodemon.json              # Nodemon configuration
└── package.json              # Dependencies and scripts
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/publisherauthority
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 3. Run the Application

**Development mode (with hot reload):**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Run production build:**
```bash
npm start
```

**Lint code:**
```bash
npm run lint
```

**Fix linting issues:**
```bash
npm run lint:fix
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID

### Websites
- `GET /api/websites` - Get all websites
- `POST /api/websites` - Create new website

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment

## Models

### User
- name, email, password
- role (user/admin)
- isVerified status

### Website
- userId, url, domain
- category, monthlyTraffic
- status (pending/approved/rejected)

### Order
- userId, websiteId
- articleTitle, articleContent
- status, price

### Payment
- userId, orderId
- amount, status
- paymentMethod, transactionId

## Next Steps

- Implement authentication logic (JWT)
- Add middleware for authentication
- Implement CRUD operations for all models
- Add input validation
- Add error handling
- Add logging
- Add tests

