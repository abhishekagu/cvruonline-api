# CVRU Online - API Documentation

This document serves as a reference for frontend developers to integrate with the CVRU Online Clone backend. All API responses follow a standardized format.

## Base URL
\`http://localhost:8000/api/v1\`

## Standard Response Format
All successful responses will follow this structure:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

All error responses will follow this structure:
```json
{
  "status": "fail",
  "message": "Error description here",
  "stack": "..." // Only visible in development mode
}
```

---

## 1. Authentication APIs

### 1.1 Register User
- **Endpoint:** \`/auth/register\`
- **Method:** \`POST\`
- **Description:** Register a new user account (e.g., as an applicant).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "9876543210",
  "password": "securepassword123",
  "role": "applicant" // Optional, defaults to "applicant"
}
```

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "role": "applicant"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully",
  "success": true
}
```

### 1.2 Login User
- **Endpoint:** \`/auth/login\`
- **Method:** \`POST\`
- **Description:** Login for existing users. Returns a JWT token to be passed in headers for protected routes.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "9876543210",
      "role": "applicant"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Logged in successfully",
  "success": true
}
```

---

## 2. Health Check API

### 2.1 Server Status
- **Endpoint:** \`/health\`
- **Method:** \`GET\`
- **Description:** Verify that the API is running correctly.

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "CVRU Online API is running!"
}
```

---

## Authorization Instructions for Frontend
For protected routes (like adding programs, applying, getting profiles), you need to include the JWT token in the request header:

```http
Authorization: Bearer <your_jwt_token_here>
```

---

## 3. Programs Catalog APIs

### 3.1 Get All Programs (Public)
- **Endpoint:** `/programs`
- **Method:** `GET`
- **Description:** Fetch a list of all academic programs. Supports query parameters (e.g. `?type=UG&is_trending=true`).

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "programs": [
      {
        "_id": "60d0fe4f5311236168a109cb",
        "name": "BCA in Data Science",
        "type": "UG",
        "duration": "3 Years",
        "eligibility_criteria": "10+2 with 50% marks",
        "total_fee": 120000,
        "is_trending": true
      }
    ]
  },
  "message": "Programs fetched successfully",
  "success": true
}
```

### 3.2 Add a New Program (Admin Only)
- **Endpoint:** `/programs`
- **Method:** `POST`
- **Description:** Create a new program in the catalog. Requires an Admin JWT token.

**Headers:**
```http
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "name": "BCA in Data Science",
  "type": "UG",
  "duration": "3 Years",
  "eligibility_criteria": "10+2 with 50% marks",
  "total_fee": 120000,
  "is_trending": true,
  "description": "A comprehensive data science bachelor's program."
}
```

---

## 4. CMS APIs (Marketing & SEO)

### 4.1 Get All Blogs (Public)
- **Endpoint:** `/cms/blogs`
- **Method:** `GET`
- **Description:** Fetch all published blogs.

### 4.2 Create a Blog (Admin Only)
- **Endpoint:** `/cms/blogs`
- **Method:** `POST`
- **Request Body:**
```json
{
  "title": "Top 10 AI Trends",
  "slug": "top-10-ai-trends",
  "content": "Full HTML/Markdown content here...",
  "coverImage": "https://bucket.s3.amazonaws.com/image.png",
  "tags": ["AI", "Technology"],
  "isPublished": true
}
```

### 4.3 Get Active FAQs (Public)
- **Endpoint:** `/cms/faqs`
- **Method:** `GET`

### 4.4 Create a FAQ (Admin Only)
- **Endpoint:** `/cms/faqs`
- **Method:** `POST`
- **Request Body:**
```json
{
  "question": "How do I apply?",
  "answer": "You can apply via the portal.",
  "category": "Admissions"
}
```

### 4.5 Get Active Banners (Public)
- **Endpoint:** `/cms/banners`
- **Method:** `GET`

### 4.6 Create a Banner (Admin Only)
- **Endpoint:** `/cms/banners`
- **Method:** `POST`
- **Request Body:**
```json
{
  "title": "Admissions Open 2026",
  "desktopImageUrl": "https://bucket.s3.amazonaws.com/desktop.png",
  "mobileImageUrl": "https://bucket.s3.amazonaws.com/mobile.png",
  "linkUrl": "/apply",
  "displayOrder": 1
}
```

---

## 5. Lead Generation APIs

### 5.1 Capture Prospectus Lead (Public)
- **Endpoint:** `/leads/prospectus`
- **Method:** `POST`
- **Description:** Submit user details to capture a lead and receive the prospectus download link.
- **Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "interested_program": "60d0fe4f5311236168a109cb"
}
```

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "lead": { ... },
    "prospectusUrl": "https://CVRU-online-mock-bucket.s3.amazonaws.com/CVRU-Online-Prospectus-2026.pdf"
  },
  "message": "Lead captured. Prospectus is ready to download.",
  "success": true
}
```

### 5.2 Get All Leads (Admin Only)
- **Endpoint:** `/leads`
- **Method:** `GET`
- **Description:** Get a list of all captured leads. Used by admission counselors.

---

## 6. Student Application Flow (Phase 3)

All these routes require an **Applicant JWT Token**.

### 6.1 Initialize Draft Application
- **Endpoint:** `/applications`
- **Method:** `POST`
- **Request Body:**
```json
{
  "programId": "60d0fe4f5311236168a109cb"
}
```

### 6.2 Update Application Data (Multi-step Form)
- **Endpoint:** `/applications/:id`
- **Method:** `PATCH`
- **Description:** Save data for Personal Details, Address, or Academics steps.
- **Request Body:**
```json
{
  "personalDetails": {
    "fatherName": "John Doe Sr",
    "dateOfBirth": "2000-01-01",
    "gender": "Male"
  },
  "address": {
    "city": "Mumbai",
    "state": "MH"
  }
}
```

### 6.3 Submit Application
- **Endpoint:** `/applications/:id/submit`
- **Method:** `POST`
- **Description:** Finalize and submit the draft application.

### 6.4 Upload/Add Document URL
- **Endpoint:** `/applications/:id/documents`
- **Method:** `POST`
- **Description:** Save a document URL (uploaded via frontend to S3).
- **Request Body:**
```json
{
  "documentType": "10th Marksheet",
  "fileUrl": "https://bucket.s3.amazonaws.com/marksheet10.pdf"
}
```

---

## 7. Admin Verification Workflows (Phase 4)

All these routes require an **Admin JWT Token**.

### 7.1 Get All Submitted Applications
- **Endpoint:** `/admin/applications`
- **Method:** `GET`
- **Description:** Fetch all non-draft applications. Supports filters (`?status=Under Review&programId=...`).

### 7.2 Update Application Status
- **Endpoint:** `/admin/applications/:id/status`
- **Method:** `PATCH`
- **Description:** Accept, Reject, or place an application Under Review.
- **Request Body:**
```json
{
  "status": "Accepted"
}
```

### 7.3 Verify a Document
- **Endpoint:** `/admin/documents/:id/verify`
- **Method:** `PATCH`
- **Description:** Approve or Reject a specific document uploaded by an applicant.
- **Request Body:**
```json
{
  "verificationStatus": "Rejected",
  "adminRemarks": "Image is too blurry to read."
}
```

### 7.4 Get Dashboard Metrics
- **Endpoint:** `/admin/dashboard/metrics`
- **Method:** `GET`
- **Description:** Get stats for the admin dashboard (total users, applications, leads, revenue).

---

## 8. Payments & Fees (Phase 5)

All these routes require an **Applicant JWT Token**.

### 8.1 Create Razorpay Order
- **Endpoint:** `/payments/create-order`
- **Method:** `POST`
- **Description:** Initiates a payment process. Generates a Razorpay `order_id` which the frontend uses to open the Razorpay Checkout modal.
- **Request Body:**
```json
{
  "applicationId": "60d0fe4f5311236168a109ca",
  "amount": 1000, 
  "type": "Application Fee"
}
```

### 8.2 Verify Razorpay Payment
- **Endpoint:** `/payments/verify`
- **Method:** `POST`
- **Description:** Verifies the cryptographic signature returned by Razorpay after successful payment.
- **Request Body:**
```json
{
  "razorpayOrderId": "order_Hjkh...",
  "razorpayPaymentId": "pay_Hjkh...",
  "razorpaySignature": "34abcdef..."
}
```

---

## 9. LMS Gateway & Placements (Phase 6)

All these routes require an **Applicant/Student JWT Token**.

### 9.1 Get Live Classes Schedule
- **Endpoint:** `/lms/classes`
- **Method:** `GET`
- **Description:** Fetch the mock live class schedule with Zoom links for the enrolled student.

### 9.2 Get All Job Postings
- **Endpoint:** `/lms/jobs`
- **Method:** `GET`
- **Description:** Fetch active job postings from the placement board.

### 9.3 Create a Job Posting (Admin Only)
- **Endpoint:** `/lms/jobs`
- **Method:** `POST`
- **Description:** Post a new job for students/alumni.
- **Request Body:**
```json
{
  "title": "Junior Node.js Developer",
  "company": "Tech Corp",
  "description": "Looking for a backend developer...",
  "requirements": ["Node.js", "MongoDB"],
  "salary": "8 LPA",
  "applyUrl": "https://techcorp.com/careers"
}
```
