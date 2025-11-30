# Backend Architecture Documentation

## 🏗️ Modular Architecture Pattern

This backend follows a **feature-based modular architecture** where each module is self-contained and independent.

## 📂 Directory Structure

```
backend/
├── src/
│   ├── config/                    # Configuration Layer
│   │   ├── database.ts           # MongoDB connection setup
│   │   └── env.ts                # Environment variables config
│   │
│   ├── middleware/                # Global Middleware Layer
│   │   ├── errorHandler.ts      # Centralized error handling
│   │   ├── notFound.ts           # 404 handler
│   │   └── validateRequest.ts   # Input validation middleware
│   │
│   ├── modules/                   # Feature Modules (Modular Pattern)
│   │   │
│   │   ├── auth/                 # Authentication Module
│   │   │   ├── auth.model.ts    # User schema & methods
│   │   │   ├── auth.service.ts  # Auth business logic
│   │   │   ├── auth.controller.ts # Request handlers
│   │   │   ├── auth.routes.ts   # Route definitions
│   │   │   └── auth.validation.ts # Input validation rules
│   │   │
│   │   ├── users/                # Users Management Module
│   │   │   ├── users.model.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   └── index.ts              # Module aggregator/router
│   │
│   ├── utils/                     # Utility Layer
│   │   ├── AppError.ts           # Custom error class
│   │   ├── asyncHandler.ts       # Async wrapper
│   │   ├── apiResponse.ts        # Response formatter
│   │   └── logger.ts             # Winston logger
│   │
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server startup
│
├── logs/                          # Application logs
├── dist/                          # Compiled JavaScript
├── .env                           # Environment variables
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── README.md                      # Documentation
```

## 🔄 Request Flow

```
Client Request
    ↓
Express App (app.ts)
    ↓
Security Middleware (helmet, cors, rate-limit)
    ↓
Body Parser & Compression
    ↓
Logger Middleware (morgan)
    ↓
Module Router (/api/v1)
    ↓
Feature Module Routes
    ↓
Validation Middleware
    ↓
Controller (Request Handler)
    ↓
Service (Business Logic)
    ↓
Model (Database)
    ↓
Service (Process Data)
    ↓
Controller (Format Response)
    ↓
API Response Utility
    ↓
Client Response
```

## 📦 Module Structure

Each module follows this pattern:

### 1. **Model Layer** (`*.model.ts`)
- Defines Mongoose schema
- Database validation rules
- Instance methods
- Static methods
- Pre/post hooks

### 2. **Service Layer** (`*.service.ts`)
- Business logic
- Data processing
- External API calls
- Database operations
- Error handling

### 3. **Controller Layer** (`*.controller.ts`)
- HTTP request/response handling
- Calls service methods
- Uses asyncHandler wrapper
- Returns formatted responses

### 4. **Routes Layer** (`*.routes.ts`)
- Defines API endpoints
- Maps routes to controllers
- Applies middleware
- Input validation

### 5. **Validation Layer** (`*.validation.ts`)
- express-validator rules
- Input sanitization
- Custom validators

## 🎯 Module Example: Auth

```typescript
// auth.model.ts - Database Schema
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  // ...
}

// auth.service.ts - Business Logic
class AuthService {
  async register(userData) {
    // Validation, hashing, database operations
  }
  async login(credentials) {
    // Authentication logic
  }
}

// auth.controller.ts - Request Handlers
class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    sendSuccess(res, 201, 'Registered', result);
  });
}

// auth.routes.ts - Route Definitions
router.post('/register', validation, controller.register);

// auth.validation.ts - Input Rules
export const registerValidation = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
];
```

## 🔐 Security Layers

1. **Helmet** - Secure HTTP headers
2. **CORS** - Cross-origin protection
3. **Rate Limiting** - Brute force prevention
4. **Data Sanitization** - NoSQL injection protection
5. **Input Validation** - express-validator
6. **Password Hashing** - bcrypt
7. **JWT Authentication** - Token-based auth

## 🛠️ Utility Functions

### AppError
```typescript
throw new AppError('User not found', 404);
```

### asyncHandler
```typescript
const handler = asyncHandler(async (req, res, next) => {
  // Automatically catches errors
});
```

### API Response
```typescript
sendSuccess(res, 200, 'Success', data);
sendError(res, 400, 'Error', error);
```

### Logger
```typescript
logger.info('Info message');
logger.error('Error message');
logger.warn('Warning');
logger.debug('Debug info');
```

## 📊 Error Handling Flow

```
Error Occurs
    ↓
asyncHandler catches it
    ↓
Passes to next(error)
    ↓
Global Error Handler Middleware
    ↓
Identifies Error Type
    ├─ Mongoose CastError → 400
    ├─ Duplicate Key → 400
    ├─ Validation Error → 400
    ├─ JWT Error → 401
    └─ Custom AppError → specified code
    ↓
Format Error Response
    ├─ Development: Full details + stack
    └─ Production: Safe message only
    ↓
Send to Client
```

## 🚀 Adding New Modules

To add a new feature (e.g., "products"):

1. Create module directory:
```bash
mkdir -p src/modules/products
```

2. Create module files:
```bash
touch src/modules/products/products.model.ts
touch src/modules/products/products.service.ts
touch src/modules/products/products.controller.ts
touch src/modules/products/products.routes.ts
touch src/modules/products/products.validation.ts
```

3. Register in `src/modules/index.ts`:
```typescript
import productsRoutes from './products/products.routes';
router.use('/products', productsRoutes);
```

## 🎨 Design Principles

1. **Separation of Concerns** - Each layer has a single responsibility
2. **DRY (Don't Repeat Yourself)** - Reusable utilities and middleware
3. **SOLID Principles** - Clean, maintainable code
4. **Scalability** - Easy to add new features
5. **Testability** - Isolated modules for unit testing
6. **Security First** - Multiple security layers
7. **Error Handling** - Comprehensive error management
8. **Type Safety** - Full TypeScript coverage

## 📈 Benefits of This Architecture

✅ **Scalability** - Add features without breaking existing code  
✅ **Maintainability** - Clear structure, easy to understand  
✅ **Testability** - Test modules independently  
✅ **Team Collaboration** - Multiple devs can work in parallel  
✅ **Code Reusability** - Shared utilities and middleware  
✅ **Production Ready** - Security, logging, error handling  
✅ **Type Safety** - TypeScript prevents runtime errors  
✅ **Documentation** - Self-documenting code structure  

## 🔄 Development Workflow

1. **Create Module** - Add new feature directory
2. **Define Model** - Create Mongoose schema
3. **Write Service** - Implement business logic
4. **Create Controller** - Handle HTTP requests
5. **Define Routes** - Map endpoints
6. **Add Validation** - Validate inputs
7. **Test** - Test module independently
8. **Register** - Add to module router
9. **Document** - Update API docs

## 📝 Best Practices

- ✅ Use TypeScript for type safety
- ✅ Validate all inputs
- ✅ Handle all errors properly
- ✅ Log important operations
- ✅ Use environment variables
- ✅ Keep modules independent
- ✅ Write clean, readable code
- ✅ Comment complex logic
- ✅ Follow naming conventions
- ✅ Keep functions small and focused

---

**This architecture is designed for production use and can scale to handle complex applications.**

