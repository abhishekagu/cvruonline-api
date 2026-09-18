# LPU Online Clone - Backend Development Plan

## 1. Executive Summary
The objective is to develop a highly scalable, secure, and robust backend system for an online education portal analogous to **LPU Online**. The platform will facilitate seamless program exploration, student admissions (domestic and international), payment processing, learning management (LMS) integration, and administrative workflows.

## 2. Tech Stack Recommendations
To ensure high performance and scalability, the following tech stack is recommended:
*   **Language & Framework**: Node.js with NestJS (preferred for enterprise-level structure) OR Python with Django/FastAPI.
*   **Database (Relational)**: PostgreSQL (for transactional data: users, applications, payments, RBAC).
*   **Database (NoSQL)**: MongoDB (for flexible data like course modules, CMS, JSON documents).
*   **Caching**: Redis (for session management, OTPs, and caching program catalogs).
*   **Storage**: AWS S3 (for student KYC documents, profile photos, prospectus PDFs, and LMS materials).
*   **Authentication**: JWT (JSON Web Tokens) with Passport.js, OAuth2 for SSO.
*   **Payment Gateway**: Razorpay, Stripe, or PayU (for application fees and tuition).

## 3. Core Modules & Functionalities

### A. User Management & Authentication
*   **Role-Based Access Control (RBAC)**: Super Admin, Admission Counselor, Faculty, Applicant, Enrolled Student, International Applicant.
*   **Features**:
    *   Registration & Login (Email, Phone/OTP).
    *   Separate login flows for **Applicant Login** and **LMS Login**.
    *   Password recovery and account verification.

### B. Program & Curriculum Management
*   **Hierarchy**: Level (PG, UG, Diploma) -> Program (e.g., MBA, BCA) -> Course/Subject -> Modules.
*   **Features**:
    *   CRUD operations for academic programs.
    *   Categorization: "Trending Courses" (AI, Data Science, Marketing, AR/VR), "Domain Wise".
    *   Prospectus management (uploading and tracking downloads for lead generation).

### C. Admission & Application Management
*   **Features**:
    *   Multi-step application form (Personal, Academic qualifications, Document Upload).
    *   Specific workflows for **International Applicants** and **Scholarships** (e.g., Jai Jawan Scholarship).
    *   Document Verification System for admins (Approve, Reject, Request Re-upload).
    *   Application status tracking.
    *   DEB-ID (Distance Education Bureau) verification/tracking support.

### D. Fees, Payments & Scholarships
*   **Features**:
    *   Fee structure generation (Semester-wise, Annual, or Lump sum).
    *   Scholarship engine (calculating fee waivers based on eligibility).
    *   Online fee payment with status webhooks from payment gateways.
    *   Invoice and receipt generation.

### E. Learning Management System (LMS) Gateway
*   **Features**:
    *   Integration with LMS front-end.
    *   Serving course schedules, live class links, and recorded lecture metadata.
    *   Assignments and grading API integrations.

### F. Placement & Alumni Support
*   **Features**:
    *   **Placement Support**: Job board for enrolled students, company profiles, application tracking.
    *   **Alumni Advantage**: Alumni directory, event registrations, and networking portal.
    *   **Jobs @ LPU Online**: Portal for hiring staff and faculty.

### G. Content Management System (CMS) & Marketing
*   **Features**:
    *   Manage Homepage Banners, Rankings, Recognitions (NAAC A++, UGC, AICTE approvals).
    *   Dynamic management of FAQs and Important Dates.
    *   **Blogs**: CRUD for SEO-friendly blog posts.

## 4. High-Level Database Schema

*   **Users**: `id`, `email`, `phone`, `password_hash`, `role_id`, `status`
*   **Profiles**: `id`, `user_id`, `first_name`, `last_name`, `dob`, `address`, `nationality`
*   **Programs**: `id`, `name`, `type` (UG/PG/Diploma), `duration`, `eligibility_criteria`, `total_fee`, `is_trending`
*   **Applications**: `id`, `user_id`, `program_id`, `status` (Draft, Submitted, Under Review, Accepted, Rejected), `submitted_at`
*   **Documents**: `id`, `application_id`, `document_type` (Aadhar, 10th Marksheet, etc.), `s3_url`, `verification_status`
*   **Payments**: `id`, `user_id`, `application_id`, `amount`, `currency`, `gateway_txn_id`, `status`, `type` (Application Fee, Tuition Fee)
*   **Leads**: `id`, `name`, `email`, `phone`, `interested_program`, `downloaded_prospectus`

## 5. API Endpoints Architecture (REST)

### Public / Open APIs
*   `GET /api/v1/programs` (List all programs, filter by type/domain)
*   `GET /api/v1/programs/trending`
*   `POST /api/v1/leads/prospectus` (Capture lead and send prospectus link)
*   `GET /api/v1/cms/blogs`

### Auth APIs
*   `POST /api/v1/auth/register`
*   `POST /api/v1/auth/login`
*   `POST /api/v1/auth/send-otp`

### Applicant APIs (Requires Applicant Token)
*   `GET /api/v1/applications/me`
*   `PATCH /api/v1/applications/me` (Update draft)
*   `POST /api/v1/applications/me/documents` (Upload KYC/Academic docs)
*   `POST /api/v1/payments/initiate`

### Admin APIs (Requires Admin Token)
*   `GET /api/v1/admin/applications` (List with filters/pagination)
*   `PATCH /api/v1/admin/applications/:id/verify-documents`
*   `GET /api/v1/admin/dashboard/metrics` (Enrollment counts, revenue)

## 6. Architecture & Scalability Strategy
1.  **Modular Monolith**: Start with a modular monolith to maintain development speed, with clean boundaries (e.g., Auth Module, Admission Module, Payment Module) for future microservice extraction.
2.  **Containerization**: Dockerize the application to ensure consistency across environments.
3.  **CI/CD**: Implement GitHub Actions or GitLab CI for automated linting, testing, and deployment.
4.  **Load Balancing**: Use Nginx or AWS ALB to distribute incoming API requests.
5.  **Rate Limiting**: Protect authentication and OTP endpoints using Redis-based rate limiting.

## 7. Security Measures
*   **Data Validation**: Strict payload validation using Zod or Class-Validator.
*   **Authentication**: Short-lived JWTs with rotating Refresh Tokens.
*   **File Uploads**: Restrict file types (PDF, JPG, PNG) and sizes. Scan uploads for malware. Use pre-signed S3 URLs for private document access.
*   **SQL Injection & XSS**: Use ORM/Query Builders (Prisma/TypeORM/Sequelize) to prevent SQLi. Sanitize CMS inputs.

## 8. Development Milestones
*   **Phase 1 (Weeks 1-2)**: DB Schema Design, Project Setup (Docker, CI/CD), Authentication & RBAC.
*   **Phase 2 (Weeks 3-4)**: Program & Course Catalog CRUD, CMS APIs (Blogs, FAQs).
*   **Phase 3 (Weeks 5-7)**: Applicant Registration, Multi-step Application Form, Document Upload (S3 integration).
*   **Phase 4 (Weeks 8-9)**: Admin Dashboard (Application Verification Workflow), Lead Capture (Prospectus).
*   **Phase 5 (Weeks 10-11)**: Payment Gateway Integration, Invoicing, Scholarship Logic.
*   **Phase 6 (Weeks 12-14)**: LMS Data Sync, Placement Portal APIs, Security Audits, and UAT.
