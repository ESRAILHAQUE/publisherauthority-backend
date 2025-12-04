# Publisher Authority Backend API

A production-ready, scalable backend API built with **Node.js**, **Express**, **TypeScript**, **Mongoose**, and **MongoDB** using a **modular architecture pattern**.

## 🏗️ Architecture

This project follows a **modular/feature-based architecture** where each feature is self-contained with its own:
- **Model** - Database schema and business logic
- **Service** - Business logic layer
- **Controller** - Request/response handling
- **Routes** - API endpoint definitions
- **Validation** - Input validation rules

### Why Modular Pattern?

✅ **Scalability** - Easy to add new features without affecting existing code  
✅ **Maintainability** - Each module is independent and easy to understand  
✅ **Testability** - Modules can be tested in isolation  
✅ **Team Collaboration** - Multiple developers can work on different modules  
✅ **Code Organization** - Clear separation of concerns

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts         # MongoDB connection
│   │   └── env.ts              # Environment variables
│   │
│   ├── middleware/             # Global middleware
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── notFound.ts         # 404 handler
│   │   └── validateRequest.ts # Request validation
│   │
│   ├── modules/                # Feature modules (modular pattern)
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.model.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   │
│   │   ├── users/              # Users module
│   │   │   ├── users.model.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   └── index.ts            # Module aggregator
│   │
│   ├── utils/                  # Utility functions
│   │   ├── AppError.ts         # Custom error class
│   │   ├── asyncHandler.ts    # Async error wrapper
│   │   ├── apiResponse.ts     # Response formatter
│   │   └── logger.ts           # Winston logger
│   │
│   ├── app.ts                  # Express app configuration
│   └── server.ts               # Server startup
│
├── dist/                       # Compiled JavaScript (generated)
├── logs/                       # Application logs
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── nodemon.json               # Nodemon configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🚀 Features

### Core Features
- ✅ **TypeScript** - Full type safety
- ✅ **Modular Architecture** - Feature-based organization
- ✅ **Error Handling** - Centralized error management
- ✅ **Validation** - Input validation with express-validator
- ✅ **Logging** - Winston logger with file and console output
- ✅ **Security** - Helmet, CORS, rate limiting, data sanitization

### Security Features
- 🔒 **Helmet** - Secure HTTP headers
- 🔒 **CORS** - Cross-origin resource sharing
- 🔒 **Rate Limiting** - Prevent brute force attacks
- 🔒 **NoSQL Injection Protection** - Data sanitization
- 🔒 **Password Hashing** - bcrypt encryption
- 🔒 **JWT Authentication** - Secure token-based auth

### Development Features
- 🛠️ **Hot Reload** - Nodemon for development
- 🛠️ **ESLint** - Code quality and consistency
- 🛠️ **TypeScript** - Compile-time error checking
- 🛠️ **Environment Variables** - dotenv configuration

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/ESRAILHAQUE/publisherauthority-backend.git
cd publisherauthority-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/publisherauthority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# Using MongoDB service
sudo systemctl start mongodb

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🎯 Usage

### Development Mode
```bash
npm run dev
```
Server will start on `http://localhost:5000` with hot reload enabled.

### Production Build
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Linting
```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Clean Build
```bash
npm run clean
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Health Check
```http
GET /
GET /api/v1/health
```

### Authentication Module

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Users Module

#### Get All Users
```http
GET /api/v1/users
```

#### Get User by ID
```http
GET /api/v1/users/:id
```

#### Update User
```http
PUT /api/v1/users/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete User
```http
DELETE /api/v1/users/:id
```

#### Get User Statistics
```http
GET /api/v1/users/stats
```

**Response:**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 10,
    "activeUsers": 8,
    "verifiedUsers": 5,
    "inactiveUsers": 2
  }
}
```

## 🏗️ Adding New Modules

To add a new feature module (e.g., "products"):

1. **Create module directory**
```bash
mkdir -p src/modules/products
```

2. **Create module files**
```
src/modules/products/
├── products.model.ts      # Mongoose schema
├── products.service.ts    # Business logic
├── products.controller.ts # Request handlers
├── products.routes.ts     # Route definitions
└── products.validation.ts # Input validation
```

3. **Register module in `src/modules/index.ts`**
```typescript
import productsRoutes from './products/products.routes';

router.use('/products', productsRoutes);
```

## 🛠️ Utilities

### AppError
Custom error class for operational errors:
```typescript
throw new AppError('User not found', 404);
```

### asyncHandler
Wraps async functions to catch errors:
```typescript
const myController = asyncHandler(async (req, res, next) => {
  // Your code here
});
```

### API Response
Standardized response format:
```typescript
sendSuccess(res, 200, 'Success message', data);
sendError(res, 400, 'Error message', error);
```

### Logger
Winston logger for structured logging:
```typescript
logger.info('Information message');
logger.error('Error message');
logger.warn('Warning message');
logger.debug('Debug message');
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/publisherauthority` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 📝 Best Practices Implemented

1. ✅ **Separation of Concerns** - Modular architecture
2. ✅ **Error Handling** - Centralized error management
3. ✅ **Input Validation** - Validate all user inputs
4. ✅ **Security** - Multiple security layers
5. ✅ **Logging** - Structured logging with Winston
6. ✅ **Type Safety** - Full TypeScript coverage
7. ✅ **Code Quality** - ESLint configuration
8. ✅ **Environment Config** - Centralized configuration
9. ✅ **Async/Await** - Modern async handling
10. ✅ **Password Security** - bcrypt hashing

## 🐛 Error Handling

The API uses a centralized error handling system:

### Operational Errors
```json
{
  "success": false,
  "message": "User not found"
}
```

### Development Mode Errors
```json
{
  "success": false,
  "message": "Error message",
  "error": { /* error details */ },
  "stack": "Error stack trace"
}
```

## 📊 Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error level logs
- `combined.log` - All logs

Console logging is enabled in development mode with colorized output.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Publisher Authority Team**

## 🙏 Acknowledgments

- Express.js for the web framework
- MongoDB for the database
- TypeScript for type safety
- All open-source contributors

---

**Happy Coding! 🚀**
