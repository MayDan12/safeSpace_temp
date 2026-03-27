# Safe Space API Documentation for Frontend

All API endpoints are prefixed with `/api`. Protected routes require a `Bearer <access_token>` in the `Authorization` header.

### Quick cURL setup

```bash
export API_URL="http://localhost:8000"
export ACCESS_TOKEN="YOUR_JWT_ACCESS_TOKEN"
```

For protected routes, add:

```bash
-H "Authorization: Bearer $ACCESS_TOKEN"
```

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
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "securePassword123",
      "pseudonym": "CoolUser",
      "firstName": "John",
      "lastName": "Doe",
      "dob": "1990-01-01",
      "role": "REGULAR",
      "kycStatus": "PENDING",
      "isBanned": false,
      "dmOptIn": true
    }'
  ```

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
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "securePassword123"
    }'
  ```

### **Refresh Token**

- **Endpoint**: `POST /auth/refresh`
- **Body**: `{ "refreshToken": "..." }`
- **Response**: Returns new access token.
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d '{
      "refreshToken": "YOUR_REFRESH_TOKEN"
    }'
  ```

### **Logout**

- **Endpoint**: `POST /auth/logout`
- **Body**: `{ "refreshToken": "..." }`
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/auth/logout" \
    -H "Content-Type: application/json" \
    -d '{
      "refreshToken": "YOUR_REFRESH_TOKEN"
    }'
  ```

---

## 2. KYC (Identity Verification)

### **Verify BVN**

- **Endpoint**: `POST /kyc/verify/bvn`
- **Body**: `{ "bvn": "12345678901" }`
- **Note**: Requires profile (`firstName`, `lastName`) to be set.
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/kyc/verify/bvn" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "bvn": "12345678901" }'
  ```

### **Verify NIN**

- **Endpoint**: `POST /kyc/verify/nin`
- **Body**: `{ "nin": "12345678901" }`
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/kyc/verify/nin" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "nin": "12345678901" }'
  ```

### **Get KYC Status**

- **Endpoint**: `GET /kyc/status`
- **Response**: `{ "kycStatus": "VERIFIED" }`
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/kyc/status" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Admin: Manual Approval/Rejection**

- `PATCH /kyc/:userId/approve`
- `PATCH /kyc/:userId/reject` (Body: `{ "reason": "..." }`)
- **Examples (cURL)**:
  ```bash
  curl -X PATCH "$API_URL/api/kyc/USER_ID/approve" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/kyc/USER_ID/reject" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "reason": "Document mismatch" }'
  ```

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
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/posts?page=1&limit=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

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
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/posts" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "content": "My first post",
      "destination": "BOARD",
      "isAnonymous": false,
      "commentsEnabled": true
    }'
  ```

### **Post Interactions**

- `GET /posts/:id`: Get single post details.
- `PATCH /posts/:id`: Edit own post content/anonymity.
- `DELETE /posts/:id`: Delete own post.
- `POST /posts/:id/support`: Toggle support (increment count).
- `PATCH /posts/:id/toggle-comments`: Enable/disable comments (Body: `{ "commentsEnabled": true }`).
- `POST /posts/:id/report`: Flag for moderation (Body: `{ "reason": "..." }`).
- **Examples (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/posts/POST_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/posts/POST_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "content": "Updated content", "isAnonymous": false }'
  ```
  ```bash
  curl -X DELETE "$API_URL/api/posts/POST_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X POST "$API_URL/api/posts/POST_ID/support" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/posts/POST_ID/toggle-comments" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "commentsEnabled": true }'
  ```
  ```bash
  curl -X POST "$API_URL/api/posts/POST_ID/report" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "reason": "Spam" }'
  ```

### **Comments**

- `GET /posts/:id/comments`: List comments for a post.
- `POST /posts/:id/comments`: Add a comment (Body: `{ "content": "...", "isAnonymous": false }`).
- `DELETE /posts/:postId/comments/:commentId`: Delete own comment.
- `POST /posts/:postId/comments/:commentId/report`: Flag comment (Body: `{ "reason": "..." }`).
- **Examples (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/posts/POST_ID/comments" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X POST "$API_URL/api/posts/POST_ID/comments" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "content": "I relate to this.", "isAnonymous": false }'
  ```
  ```bash
  curl -X DELETE "$API_URL/api/posts/POST_ID/comments/COMMENT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X POST "$API_URL/api/posts/POST_ID/comments/COMMENT_ID/report" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "reason": "Harassment" }'
  ```

---

## 4. Groups & Sessions

### **List Groups**

- **Endpoint**: `GET /groups`
- **Response**: List of public groups with member counts and leader info.
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/groups" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

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
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/groups" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Anxiety Support Group",
      "description": "A safe space for those dealing with anxiety",
      "isClosed": false,
      "requiresPayment": false,
      "entryFee": 0,
      "memberLimit": 50
    }'
  ```

### **Group Management**

- `GET /groups/:id`: Get full details of a group.
- `PATCH /groups/:id`: Update group settings (Leader only).
- `DELETE /groups/:id`: Delete a group (Leader only).
- **Examples (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/groups/GROUP_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/groups/GROUP_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "description": "Updated group description" }'
  ```
  ```bash
  curl -X DELETE "$API_URL/api/groups/GROUP_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Membership**

- `POST /groups/:id/join`: Join a group.
- `POST /groups/:id/leave`: Leave a group (Leaders cannot leave, they must delete).
- `GET /groups/:id/members`: List all group members (Leader only).
- `DELETE /groups/:id/members/:userId`: Remove a member from the group (Leader only).
- **Examples (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/groups/GROUP_ID/join" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X POST "$API_URL/api/groups/GROUP_ID/leave" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X GET "$API_URL/api/groups/GROUP_ID/members" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X DELETE "$API_URL/api/groups/GROUP_ID/members/USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Sessions (AMA, Discussions)**

- `POST /groups/:id/sessions`: Create a group session (Leader only).
- `GET /groups/:id/sessions`: List all sessions in a group (Members only).
- `PATCH /groups/:id/sessions/:sessionId`: Update or close a session (Leader only).
- **Examples (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/groups/GROUP_ID/sessions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "title": "Weekly Check-in", "type": "DISCUSSION", "scheduledAt": "2026-04-01T18:00:00.000Z" }'
  ```
  ```bash
  curl -X GET "$API_URL/api/groups/GROUP_ID/sessions" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/groups/GROUP_ID/sessions/SESSION_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "status": "ENDED" }'
  ```

---

## 5. Professionals

All endpoints are under `/professionals` and require JWT.

### **List verified professionals**

- **Endpoint**: `GET /professionals`
- **Optional query**: `?specialty=therapist`
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/professionals?specialty=therapy" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **View professional profile**

- **Endpoint**: `GET /professionals/:id`
- **Note**: `:id` is the professional's `userId`.
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/professionals/PROFESSIONAL_USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Submit professional profile (triggers verification)**

- **Endpoint**: `POST /professionals/profile`
- **Body**:
  ```json
  {
    "bio": "Licensed therapist with 8 years experience",
    "specialty": "Anxiety",
    "availabilityNote": "Weekdays 9am-5pm",
    "contactPreference": "email"
  }
  ```
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/professionals/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "bio": "Licensed therapist with 8 years experience",
      "specialty": "Anxiety",
      "availabilityNote": "Weekdays 9am-5pm",
      "contactPreference": "email"
    }'
  ```

### **Update own professional profile**

- **Endpoint**: `PATCH /professionals/profile`
- **Guard**: Professional
- **Body (partial allowed)**:
  ```json
  {
    "availabilityNote": "Weekdays 10am-4pm"
  }
  ```
- **Example (cURL)**:
  ```bash
  curl -X PATCH "$API_URL/api/professionals/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "availabilityNote": "Weekdays 10am-4pm" }'
  ```

### **Send connection request (MVP)**

- **Endpoint**: `POST /professionals/:id/connect`
- **Note**: `:id` is the professional's `userId`.
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/professionals/PROFESSIONAL_USER_ID/connect" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

---

## 6. Bookings

All endpoints are under `/bookings` and require JWT. Some routes are Professional-only.

### **Request a 1-on-1 booking**

- **Endpoint**: `POST /bookings`
- **Body**:
  ```json
  {
    "professionalId": "PROFESSIONAL_PROFILE_ID",
    "proposedAt": "2026-04-01T18:00:00.000Z",
    "notes": "Prefer a 45-min session"
  }
  ```
- **Note**: `professionalId` is the `ProfessionalProfile.id` (not the userId).
- **Example (cURL)**:
  ```bash
  curl -X POST "$API_URL/api/bookings" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "professionalId": "PROFESSIONAL_PROFILE_ID",
      "proposedAt": "2026-04-01T18:00:00.000Z",
      "notes": "Prefer a 45-min session"
    }'
  ```

### **List own bookings (user or professional view)**

- **Endpoint**: `GET /bookings`
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/bookings" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Get booking details**

- **Endpoint**: `GET /bookings/:id`
- **Guard**: JWT + Participant
- **Example (cURL)**:
  ```bash
  curl -X GET "$API_URL/api/bookings/BOOKING_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Professional actions**

- `PATCH /bookings/:id/accept`: Professional accepts booking
- `PATCH /bookings/:id/decline`: Professional declines booking
- `PATCH /bookings/:id/reschedule`: Propose a new time (Body: `{ "proposedAt": "..." }`)
- `PATCH /bookings/:id/complete`: Mark session complete (triggers escrow release if a Transaction exists)
- **Examples (cURL)**:
  ```bash
  curl -X PATCH "$API_URL/api/bookings/BOOKING_ID/accept" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/bookings/BOOKING_ID/decline" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```
  ```bash
  curl -X PATCH "$API_URL/api/bookings/BOOKING_ID/reschedule" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "proposedAt": "2026-04-02T18:00:00.000Z" }'
  ```
  ```bash
  curl -X PATCH "$API_URL/api/bookings/BOOKING_ID/complete" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

### **Cancel booking**

- **Endpoint**: `DELETE /bookings/:id`
- **Guard**: JWT + Participant
- **Example (cURL)**:
  ```bash
  curl -X DELETE "$API_URL/api/bookings/BOOKING_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  ```

---

## Error Handling

The API returns standard HTTP status codes:

- `200/201`: Success
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Invalid/Expired token)
- `403`: Forbidden (Not the owner/Insufficient role)
- `404`: Not Found
- `409`: Conflict (Email already exists)
