## 🔌 Complete API Documentation

### Base URL
```
Production: https://api.publisherauthority.com/api/v1
Development: http://localhost:5003/api/v1
```

---

## 🔓 Public Endpoints

### Authentication

#### Register User (Admin Only)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "country": "USA"
}
```

#### Login
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

### Applications

#### Submit Application
```http
POST /api/v1/applications
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "country": "USA",
  "guestPostUrls": ["url1", "url2", "url3"],
  "quizAnswers": { ... }
}
```

### Blog (Public)

#### Get All Blog Posts
```http
GET /api/v1/blog/posts?page=1&limit=20&category=seo
```

#### Get Blog Post by Slug
```http
GET /api/v1/blog/posts/:slug
```

#### Get All Categories
```http
GET /api/v1/blog/categories
```

---

## 🔐 Publisher Endpoints (Protected)

### Dashboard

#### Get Dashboard Stats
```http
GET /api/v1/dashboard
Authorization: Bearer <token>
```

### Websites

#### Add Website
```http
POST /api/v1/websites
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com",
  "domainAuthority": 45,
  "monthlyTraffic": 10000,
  "niche": "Technology",
  "description": "Tech blog"
}
```

#### Bulk Add Websites
```http
POST /api/v1/websites/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "websites": [
    {
      "url": "https://example1.com",
      "domainAuthority": 45,
      "monthlyTraffic": 10000,
      "niche": "Tech"
    },
    ...
  ]
}
```

#### Get User's Websites
```http
GET /api/v1/websites?status=active
Authorization: Bearer <token>
```

#### Get Website by ID
```http
GET /api/v1/websites/:id
Authorization: Bearer <token>
```

#### Update Website
```http
PUT /api/v1/websites/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description"
}
```

#### Delete Website
```http
DELETE /api/v1/websites/:id
Authorization: Bearer <token>
```

#### Respond to Counter Offer
```http
POST /api/v1/websites/:id/counter-offer/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "accept": true
}
```

### Orders

#### Get User's Orders
```http
GET /api/v1/orders?status=ready-to-post&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

#### Submit Post URL
```http
POST /api/v1/orders/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "submittedUrl": "https://example.com/my-post"
}
```

#### Get Order Statistics
```http
GET /api/v1/orders/stats
Authorization: Bearer <token>
```

### Payments

#### Get User's Payments
```http
GET /api/v1/payments?status=paid&page=1&limit=20
Authorization: Bearer <token>
```

#### Get Payment by ID
```http
GET /api/v1/payments/:id
Authorization: Bearer <token>
```

#### Update Payment Settings
```http
PUT /api/v1/payments/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "paypalEmail": "john@paypal.com"
}
```

#### Get Payment Statistics
```http
GET /api/v1/payments/stats
Authorization: Bearer <token>
```

### Support

#### Create Support Ticket
```http
POST /api/v1/support/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Issue with order",
  "message": "I need help with..."
}
```

#### Get User's Tickets
```http
GET /api/v1/support/tickets?status=open
Authorization: Bearer <token>
```

#### Get Ticket by ID
```http
GET /api/v1/support/tickets/:id
Authorization: Bearer <token>
```

#### Add Message to Ticket
```http
POST /api/v1/support/tickets/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Additional information..."
}
```

### Users

#### Get All Users
```http
GET /api/v1/users
Authorization: Bearer <token>
```

#### Get User by ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated Name"
}
```

#### Get User Statistics
```http
GET /api/v1/users/stats
Authorization: Bearer <token>
```

---

## 👑 Admin Endpoints (Admin Only)

### Dashboard

#### Get Admin Dashboard Stats
```http
GET /api/v1/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Get Recent Activity
```http
GET /api/v1/admin/activity
Authorization: Bearer <admin-token>
```

### Publishers Management

#### Get All Publishers
```http
GET /api/v1/admin/publishers?accountLevel=gold&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Get Publisher Details
```http
GET /api/v1/admin/publishers/:id
Authorization: Bearer <admin-token>
```

#### Update Publisher Level
```http
PUT /api/v1/admin/publishers/:id/level
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "accountLevel": "gold"
}
```

#### Update Publisher Status
```http
PUT /api/v1/admin/publishers/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "accountStatus": "suspended"
}
```

### Websites Management

#### Get All Websites
```http
GET /api/v1/admin/websites?status=pending&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Verify Website
```http
PUT /api/v1/admin/websites/:id/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "method": "tag"
}
```

#### Send Counter Offer
```http
POST /api/v1/admin/websites/:id/counter-offer
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "notes": "We can offer...",
  "terms": "Terms and conditions..."
}
```

#### Update Website Status
```http
PUT /api/v1/admin/websites/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "rejected",
  "rejectionReason": "Does not meet requirements"
}
```

### Orders Management

#### Get All Orders
```http
GET /api/v1/admin/orders?status=verifying&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Create Order
```http
POST /api/v1/admin/orders
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "publisherId": "user_id",
  "websiteId": "website_id",
  "title": "Article Title",
  "content": "Article content...",
  "targetUrl": "https://target.com",
  "keywords": ["keyword1", "keyword2"],
  "anchorText": "anchor text",
  "deadline": "2025-12-31",
  "earnings": 50
}
```

#### Update Order
```http
PUT /api/v1/admin/orders/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "deadline": "2025-12-31"
}
```

#### Update Order Status
```http
PUT /api/v1/admin/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Verified successfully"
}
```

### Payments Management

#### Get All Payments
```http
GET /api/v1/admin/payments?status=pending&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Generate Invoice
```http
POST /api/v1/admin/payments/generate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user_id",
  "orderIds": ["order_id_1", "order_id_2"]
}
```

#### Process Payment
```http
PUT /api/v1/admin/payments/:id/process
Authorization: Bearer <admin-token>
```

#### Mark Payment as Paid
```http
PUT /api/v1/admin/payments/:id/mark-paid
Authorization: Bearer <admin-token>
```

### Applications Management

#### Get All Applications
```http
GET /api/v1/admin/applications?status=pending&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Get Application by ID
```http
GET /api/v1/admin/applications/:id
Authorization: Bearer <admin-token>
```

#### Approve Application
```http
POST /api/v1/admin/applications/:id/approve
Authorization: Bearer <admin-token>
```

#### Reject Application
```http
POST /api/v1/admin/applications/:id/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "rejectionReason": "Does not meet requirements"
}
```

### Support Tickets Management

#### Get All Tickets
```http
GET /api/v1/admin/support/tickets?status=open&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Assign Ticket
```http
POST /api/v1/admin/support/tickets/:id/assign
Authorization: Bearer <admin-token>
```

#### Update Ticket Status
```http
PUT /api/v1/admin/support/tickets/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "resolved"
}
```

### Blog Management

#### Get All Blog Posts (Admin)
```http
GET /api/v1/admin/blog/posts?status=draft&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Create Blog Post
```http
POST /api/v1/admin/blog/posts
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Post Title",
  "slug": "post-title",
  "content": "Post content...",
  "excerpt": "Short excerpt",
  "category": "category_id",
  "tags": ["seo", "marketing"],
  "status": "published"
}
```

#### Get Blog Post by ID
```http
GET /api/v1/admin/blog/posts/:id
Authorization: Bearer <admin-token>
```

#### Update Blog Post
```http
PUT /api/v1/admin/blog/posts/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

#### Delete Blog Post
```http
DELETE /api/v1/admin/blog/posts/:id
Authorization: Bearer <admin-token>
```

#### Create Category
```http
POST /api/v1/admin/blog/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "SEO",
  "slug": "seo",
  "description": "SEO related posts"
}
```

#### Update Category
```http
PUT /api/v1/admin/blog/categories/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Category
```http
DELETE /api/v1/admin/blog/categories/:id
Authorization: Bearer <admin-token>
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": { ... }
}
```

---

## 🔑 Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Token is returned after successful login/registration.

---

## 📝 Status Values

### Website Status
- `pending` - Awaiting review
- `counter-offer` - Counter offer sent
- `active` - Approved and active
- `rejected` - Rejected
- `deleted` - Deleted by user

### Order Status
- `pending` - Just assigned
- `ready-to-post` - Content ready to publish
- `verifying` - Posted, awaiting verification
- `completed` - Verified and completed
- `revision-requested` - Needs revision
- `cancelled` - Cancelled

### Payment Status
- `pending` - Awaiting payment
- `processing` - Being processed
- `paid` - Payment completed
- `failed` - Payment failed

### Application Status
- `pending` - Under review
- `approved` - Approved, user created
- `rejected` - Rejected

### Support Ticket Status
- `open` - New ticket
- `in-progress` - Being handled
- `resolved` - Issue resolved
- `closed` - Ticket closed

### Account Levels
- `silver` - 0-49 orders, 0-29 websites
- `gold` - 50-149 orders, 30-99 websites
- `premium` - 150+ orders, 100+ websites

---

## 🎯 Complete Module List

✅ **Auth Module** - Authentication & Authorization  
✅ **Users Module** - User management  
✅ **Dashboard Module** - Publisher dashboard stats  
✅ **Websites Module** - Website CRUD & verification  
✅ **Orders Module** - Order management & submission  
✅ **Payments Module** - Invoices & payment processing  
✅ **Applications Module** - Publisher applications  
✅ **Blog Module** - CMS functionality  
✅ **Support Module** - Support ticket system  
✅ **Admin Module** - All admin operations  

---

**Total Endpoints: 60+**

