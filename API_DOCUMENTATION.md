# Safe Space API Documentation for Frontend

All API endpoints are prefixed with `/api`. Protected routes require a `Bearer <access_token>` in the `Authorization` header.

## 1. Authentication

### **Register**

- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "pseudonym": "CoolUser",
    "firstName": "John", // Required for KYC later
    "lastName": "Doe", // Required for KYC later
    "dob": "1990-01-01", // Required for KYC later
    "role": "REGULAR", // REGULAR, VERIFIED_PERSON, PROFESSIONAL, ADMIN
    "kycStatus": "PENDING",
    "isBanned": false,
    "dmOptIn": true
  }
  ```
- **Response**: Returns JWT access/refresh tokens and user object.

### **Login**

- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: `{ "access_token": "...", "refresh_token": "...", "user": { ... } }`

### **Refresh Token**

- **Endpoint**: `POST /auth/refresh`
- **Body**: `{ "refreshToken": "..." }`
- **Response**: Returns new access token.

### **Logout**

- **Endpoint**: `POST /auth/logout`
- **Body**: `{ "refreshToken": "..." }`

---

## 2. KYC (Identity Verification)

### **Verify BVN**

- **Endpoint**: `POST /kyc/verify/bvn`
- **Body**: `{ "bvn": "12345678901" }`
- **Note**: Requires profile (`firstName`, `lastName`) to be set.

### **Verify NIN**

- **Endpoint**: `POST /kyc/verify/nin`
- **Body**: `{ "nin": "12345678901" }`

### **Get KYC Status**

- **Endpoint**: `GET /kyc/status`
- **Response**: `{ "kycStatus": "VERIFIED" }`

### **Admin: Manual Approval/Rejection**

- `PATCH /kyc/:userId/approve`
- `PATCH /kyc/:userId/reject` (Body: `{ "reason": "..." }`)

---

## 3. Community (Posts & Comments)

### **List Posts (Paginated)**

- **Endpoint**: `GET /posts?page=1&limit=10`
- **Response**:
  ```json
  {
    "data": [...],
    "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
  }
  ```
- **Note**: `author` is `null` if the post is anonymous.

### **Create Post**

- **Endpoint**: `POST /posts`
- **Body**:
  ```json
  {
    "content": "My first post",
    "destination": "BOARD", // WALL, BOARD, BOTH
    "isAnonymous": false,
    "commentsEnabled": true
  }
  ```

### **Post Interactions**

- `GET /posts/:id`: Get single post details.
- `PATCH /posts/:id`: Edit own post content/anonymity.
- `DELETE /posts/:id`: Delete own post.
- `POST /posts/:id/support`: Toggle support (increment count).
- `PATCH /posts/:id/toggle-comments`: Enable/disable comments (Body: `{ "commentsEnabled": true }`).
- `POST /posts/:id/report`: Flag for moderation (Body: `{ "reason": "..." }`).

### **Comments**

- `GET /posts/:id/comments`: List comments for a post.
- `POST /posts/:id/comments`: Add a comment (Body: `{ "content": "...", "isAnonymous": false }`).
- `DELETE /posts/:postId/comments/:commentId`: Delete own comment.
- `POST /posts/:postId/comments/:commentId/report`: Flag comment (Body: `{ "reason": "..." }`).

---

## 4. Groups & Sessions

### **List Groups**

- **Endpoint**: `GET /groups`
- **Response**: List of public groups with member counts and leader info.

### **Create Group**

- **Endpoint**: `POST /groups`
- **Body**:
  ```json
  {
    "name": "Anxiety Support Group",
    "description": "A safe space for those dealing with anxiety",
    "isClosed": false,
    "requiresPayment": false,
    "entryFee": 0,
    "memberLimit": 50
  }
  ```
- **Note**: Only `VERIFIED_PERSON` or `PROFESSIONAL` roles can create groups.

### **Group Management**

- `GET /groups/:id`: Get full details of a group.
- `PATCH /groups/:id`: Update group settings (Leader only).
- `DELETE /groups/:id`: Delete a group (Leader only).

### **Membership**

- `POST /groups/:id/join`: Join a group.
- `POST /groups/:id/leave`: Leave a group (Leaders cannot leave, they must delete).
- `GET /groups/:id/members`: List all group members (Leader only).
- `DELETE /groups/:id/members/:userId`: Remove a member from the group (Leader only).

### **Sessions (AMA, Discussions)**

- `POST /groups/:id/sessions`: Create a group session (Leader only).
- `GET /groups/:id/sessions`: List all sessions in a group (Members only).
- `PATCH /groups/:id/sessions/:sessionId`: Update or close a session (Leader only).

---

## Error Handling

The API returns standard HTTP status codes:

- `200/201`: Success
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Invalid/Expired token)
- `403`: Forbidden (Not the owner/Insufficient role)
- `404`: Not Found
- `409`: Conflict (Email already exists)
  ss
