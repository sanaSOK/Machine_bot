# GEMINI.md — Workspace AI Instructions
## Production Architecture & Context Engineering
### Project: Telegram Attendance & Workforce Management Platform (NestJS / TypeScript / MySQL)

> **Source of Truth**: This document is the definitive architectural specification for any AI assistant (Gemini, Claude, Copilot, etc.) operating in this repository. 
> Read and understand every section before analyzing, refactoring, or generating code.
> When any prompt conflicts with this document, adhere to this document unless explicitly overridden by the developer.

---

## 1. Mission & Senior Engineering Standards

This repository powers a **production-grade enterprise Telegram Mini-App Attendance & Workforce Management System**. 
Every line of code must be written to the standard of a Principal / Senior Engineer: clean, modular, resilient, strictly typed, and secure.

### Non-Negotiables:
1. **Domain & Business Logic Integrity**: Attendance records represent employee work hours, payroll inputs, and punctuality logs. Timestamps, check-in statuses, grace periods, and late calculations must be mathematically exact and immune to timezone drift.
2. **Strict File & Architectural Separation**: Follow NestJS modular design. Never place business logic in Controllers. Never leak database QueryBuilders into HTTP layers. Maintain distinct DTOs, Entities, Services, Controllers, and Schedulers.
3. **Database Nuance Awareness**: Never assume entity names match table names 1:1 without checking `@Entity('...')`. Understand the distinction between Telegram Staff employees and Web Dashboard Administrators (see [§3](#3-critical-domain-model--database-entity-mappings)).
4. **Security by Design**: Every endpoint must be guarded. Telegram WebApp `initData` must be cryptographically verified using HMAC-SHA256 before issuing tokens. File uploads must enforce MIME checks, size limits, and sanitized storage paths. No raw SQL concatenation.
5. **Clean Code & Reusability**: Do not duplicate logic. Extract shared helpers, query fragments, and constants into clean, single-responsibility modules. Prefer predictable, explicit, readable code over clever obscurities.

---

## 2. Actual Production Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Runtime** | Node.js (LTS v18+ or v20+) | High concurrency I/O |
| **Framework** | NestJS v10 | Dependency injection, modular architecture |
| **Language** | TypeScript | `strict: true`, strict typing, zero implicit `any` |
| **Database** | MySQL 8.x | UTF-8 mb4, InnoDB, strict relational foreign keys |
| **ORM** | TypeORM v0.3.x (`@nestjs/typeorm`) | Active repository pattern, explicit migrations/schemas |
| **Auth System** | Dual Authentication | 1. Telegram WebApp cryptographic hash auth (HMAC-SHA256)<br>2. JWT Bearer token authentication (`passport-jwt`, `@nestjs/jwt`) |
| **Scheduling** | `@nestjs/schedule` | Cron-based daily summary digests and scheduled rollups |
| **File Storage** | Multer + DiskStorage | Local secure disk storage under `uploads/` with date/user directory segregation |
| **Reporting** | ExcelJS | Multi-column, formatted attendance and employee report exports |
| **Validation** | `class-validator` + `class-transformer` | Whitelisted, typed DTO validation pipes |
| **Logging** | NestJS `Logger` | Structured logs with contextual class labeling |

---

## 3. Critical Domain Model & Database Entity Mappings

> [!IMPORTANT]
> **CRITICAL ENTITY MAPPING WARNING**: 
> The database schema uses legacy and specialized table names. You must **NEVER** confuse Telegram Bot Staff users with Dashboard Admin accounts.

```
Database Tables                  TypeORM Entities                  Purpose
┌─────────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────────────────────────────┐
│ staffs                  │ <──> │ User                    │ <──> │ Telegram bot users / Staff / Employees       │
│ (users/user.entity.ts)  │      │                         │      │ Clock-in, check-out, Telegram chat ID        │
├─────────────────────────┤      ├─────────────────────────┤      ├──────────────────────────────────────────────┤
│ users                   │ <──> │ AdminUser               │ <──> │ Web Dashboard Administrators                 │
│ (users/admin-user.ts)   │      │                         │      │ Role 1: Super-Admin, Role 2: Admin           │
├─────────────────────────┤      ├─────────────────────────┤      ├──────────────────────────────────────────────┤
│ attendances             │ <──> │ Attendance              │ <──> │ Daily check-in/out records, selfie photo,    │
│                         │      │                         │      │ GPS coordinates (lat/lng), address           │
├─────────────────────────┤      ├─────────────────────────┤      ├──────────────────────────────────────────────┤
│ departments             │ <──> │ Department              │ <──> │ Company departments (color, name, desc)      │
├─────────────────────────┤      ├─────────────────────────┤      ├──────────────────────────────────────────────┤
│ works                   │ <──> │ Work                    │ <──> │ Shift definitions: work_start_time,          │
│                         │      │                         │      │ work_end_time, grace_period_minutes          │
├─────────────────────────┤      ├─────────────────────────┤      ├──────────────────────────────────────────────┤
│ admin_organizations     │ <──> │ AdminOrganization       │ <──> │ Multi-tenant organization configs & bots     │
└─────────────────────────┘      └─────────────────────────┘      └──────────────────────────────────────────────┘
```

### Table Relationships & Key Columns:
1. **`staffs` table** (Mapped to `User` entity):
   - `id`: Primary key.
   - `department_id`: Foreign key -> `departments(id)`.
   - `fullname` / `first_name`: Employee name.
   - `telegram_chat_id`: BigInt, unique Telegram User ID.
   - `is_active`: Boolean/tinyint flag.
2. **`users` table** (Mapped to `AdminUser` entity):
   - `id`: Primary key.
   - `email`: Unique login email.
   - `password`: Hashed password.
   - `role`: `1` = Super-Admin, `2` = Admin.
3. **`attendances` table** (Mapped to `Attendance` entity):
   - `staff_id`: Foreign key -> `staffs(id)`.
   - `action`: `ENUM('CHECK_IN', 'CHECK_OUT')`.
   - `photo_url`: Path to selfie photo (`uploads/attendance/...`).
   - `latitude`, `longitude`: Decimal GPS coordinates for geofence validation.
   - `created_at`: Timestamp of action.

---

## 4. Production Codebase Organization & Pattern

The project organizes features into self-contained domain directories directly under `src/`:

```
backend/
├── database/
│   └── init.sql                 # Baseline MySQL schema & default department seeds
├── uploads/                     # File upload destination (ignored in Git)
│   ├── attendance/              # Structured: attendance/<username>/<YYYY>/<MM>/
│   └── org_logo_*.png           # Uploaded organization logos
├── src/
│   ├── admin/                   # Admin dashboard endpoints, Excel export, settings
│   │   ├── department.entity.ts
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   └── daily-summary.scheduler.ts  # Daily 18:00 Telegram report cron
│   ├── attendance/              # Core check-in / check-out workflows
│   │   ├── dto/                 # CheckInDto, CheckOutDto
│   │   ├── attendance.entity.ts
│   │   ├── attendance.controller.ts
│   │   ├── attendance.service.ts
│   │   └── attendance.module.ts
│   ├── auth/                    # Authentication (Telegram WebApp & JWT)
│   │   ├── dto/                 # TelegramAuthDto
│   │   ├── current-user.decorator.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── common/                  # Reusable cross-cutting concerns
│   │   └── filters/
│   │       └── http-exception.filter.ts # Uniform error handling
│   ├── staffs/                  # Shift & work schedules
│   │   └── work.entity.ts
│   ├── super-admin/             # Multi-tenant admin organizations
│   │   ├── admin-organization.entity.ts
│   │   ├── super-admin.controller.ts
│   │   ├── super-admin.service.ts
│   │   └── super-admin.module.ts
│   ├── telegram/                # Telegram Bot API client & polling
│   │   ├── telegram.controller.ts
│   │   ├── telegram.service.ts
│   │   └── telegram.module.ts
│   ├── users/                   # Staff and Admin user services & entities
│   │   ├── user.entity.ts       # Maps to 'staffs'
│   │   ├── admin-user.entity.ts # Maps to 'users'
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── app.controller.ts
│   ├── app.module.ts            # Root module registering TypeORM & submodules
│   └── main.ts                  # NestJS bootstrap, CORS, global validation pipe
├── Dockerfile                   # Production multi-stage Docker build
├── docker-compose.dev.yml       # Local development MySQL & services
└── package.json
```

### Separation of Concerns Rules:
- **Controllers**: Thin orchestration only. Read DTOs, extract user context via `@CurrentUser()`, call one service method, and return. No business calculations in controllers.
- **Services**: All business logic, transaction handling, date comparisons, GPS math, and Telegram alerts live here.
- **DTOs**: Every request payload must have an explicit DTO with `class-validator` decorators.
- **Entities**: TypeORM entities must explicitly specify `@Entity('exact_table_name')`, column types, and relational foreign keys (`onDelete: 'CASCADE'`).

---

## 5. Business Logic & Core Algorithms

### 5.1. Attendance State Machine & Session Flow
Each employee's day transitions through a defined state machine:
```
                      ┌──────────────────────┐
                      │    NOT_CHECKED_IN    │
                      └──────────┬───────────┘
                                 │
                   Check-In (Photo + GPS required)
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │       WORKING        │
                      └──────────┬───────────┘
                                 │
                   Check-Out (Photo + GPS required)
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │      COMPLETED       │
                      └──────────────────────┘
```
- **Re-check-in Rule**: If an employee has checked in and checks in again within the same workday, update/log the active working state or record the latest session based on system settings.
- **Session Lookup**: Filter today's records between `startOfDay` (00:00:00.000) and `endOfDay` (23:59:59.999) using `Between(...)` in MySQL local/server timezone.

### 5.2. Shift & Punctuality Calculation
- Retrieve shift config (`work_start_time`, `work_end_time`, `grace_period_minutes`) from `works` or system settings.
- **Late Threshold**: `work_start_time + grace_period_minutes`.
  - Example: Work starts at `08:00`, grace period = `15` min. Any check-in after `08:15` is flagged as **LATE**.
- **Early Departure**: Any check-out before `work_end_time` (e.g. `17:00`) is flagged as **EARLY_LEAVE**.

### 5.3. Geofencing & GPS Verification Algorithm
When `requireGps: true`:
- The client sends `latitude` and `longitude`.
- Validate coordinates using the Haversine formula against the workplace coordinates:
  $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- If distance $> \text{allowedRadiusMeters}$ (e.g. 100m), throw `BadRequestException('Check-in location is outside the allowed office perimeter')`.

### 5.4. Automated Daily Summary Digest (Scheduler)
- Runs via `@Cron('0 18 * * *')` in [daily-summary.scheduler.ts](file:///Users/khonchanphearaa/Documents/DSA/eroxii/machine-bot/Machine_bot/backend/src/admin/daily-summary.scheduler.ts).
- Aggregates:
  1. Total active staff count.
  2. Total present staff (checked in today).
  3. Total on-time vs late check-ins.
  4. Total absentees (`total_active - checked_in`).
- Formats a clean Telegram Markdown message and posts it via `TelegramService.sendMessage` to the designated Admin Telegram Channel / Topic.

### 5.5. Excel Ledger Generation
- Uses `exceljs` to generate dynamic attendance sheets.
- Pre-formats headers with corporate styles (bold, background fill, column auto-widths).
- Formats dates as `YYYY-MM-DD HH:mm:ss` and labels statuses clearly (`ON_TIME`, `LATE`, `WORKING`, `COMPLETED`).

---

## 6. Security, Cryptography & Auth Architecture

### 6.1. Telegram Mini-App WebApp Cryptographic Validation
Never trust client-provided Telegram IDs. Every Telegram auth request passes `initData` (raw query string from Telegram WebApp):
```ts
// Auth validation algorithm:
1. Parse query string into key-value pairs; extract 'hash'.
2. Sort remaining keys alphabetically and concatenate as "key=value\n".
3. Compute secret_key = HMAC_SHA256("WebAppData", TELEGRAM_BOT_TOKEN).
4. Compute calculated_hash = HMAC_SHA256(secret_key, data_check_string).
5. Compare calculated_hash === hash using timingSafeEqual.
6. Verify (current_timestamp - auth_date) < 86400 to prevent replay attacks.
```
Once verified, find or create the staff in the `staffs` table, then sign and return a JWT access token containing `{ sub: user.id, telegram_user_id }`.

### 6.2. JWT Strategy & Guarding
- Bearer tokens are validated by [jwt.strategy.ts](file:///Users/khonchanphearaa/Documents/DSA/eroxii/machine-bot/Machine_bot/backend/src/auth/jwt.strategy.ts).
- In `validate(payload)`: Lookup `User` (`staffs`) by ID. Confirm `is_active === true`. Inactive or deleted accounts throw `UnauthorizedException`.
- Protect employee endpoints with `@UseGuards(JwtAuthGuard)` and access user data via `@CurrentUser()`.

### 6.3. File Upload Hardening (Selfies & Logos)
- **Destination**: Segregate uploads by user and date:
  `uploads/attendance/<sanitized_username>/<YYYY>/<MM>/photo-<timestamp>-<random>.jpg`
- **MIME & Extension Whitelist**: Allow only `image/jpeg`, `image/png`, `image/webp`. Reject executable extensions.
- **File Size Cap**: Maximum 5MB (`5 * 1024 * 1024`).
- **Filename Sanitization**: Strip dangerous path characters (`..`, `/`, `\`) to prevent directory traversal.

### 6.4. Database Query Safety
- **No string concatenation** in queries.
- Use TypeORM's parameterized methods:
  ```ts
  // CORRECT:
  this.attendanceRepository.createQueryBuilder('a')
    .where('a.staff_id = :staffId', { staffId })
    .andWhere('a.created_at BETWEEN :start AND :end', { start, end });
  ```

---

## 7. Performance & Optimization Standards

1. **Database Indexing**:
   - `attendances`: composite or single indexes on `(staff_id, created_at)` for fast daily status lookups.
   - `staffs`: unique index on `telegram_chat_id`, index on `department_id`.
   - `users`: unique index on `email`.
2. **Avoid N+1 Queries**:
   - When fetching attendance logs with user and department info, use TypeORM `.leftJoinAndSelect('attendance.user', 'user')` and `.leftJoinAndSelect('user.department', 'department')`. Never loop through attendances executing individual queries per row.
3. **Pagination on All Listings**:
   - Admin attendance tables and employee lists must accept `limit` and `offset` (or `page` and `pageSize`). Never return unbound `SELECT *` queries on high-growth tables.
4. **Static File Serving**:
   - Uploads are served via `@nestjs/serve-static` at `/uploads`. Keep uploaded files outside the compilation `dist/` folder so rebuilds don't delete media.

---

## 8. Error Handling & Standard Responses

All exceptions are caught and standardized by the global `AllExceptionsFilter`:
- Handled `HttpException` (e.g. `BadRequestException`, `UnauthorizedException`) returns proper HTTP status and informative message.
- Unhandled server errors log the error stack internally and return a clean 500:
  ```json
  {
    "statusCode": 500,
    "message": "Internal server error",
    "timestamp": "2026-09-14T04:20:00.000Z",
    "path": "/api/attendance/check-in"
  }
  ```

---

## 9. AI Assistant Pre-Implementation Checklist

Before modifying or creating any code in this repository, the AI assistant must:
- [ ] **Identify the Actor & Target Entity**: Am I touching Telegram staff (`staffs` -> `User`) or Dashboard admin (`users` -> `AdminUser`)?
- [ ] **Check Existing Services**: Does `TelegramService`, `AdminService`, or `AttendanceService` already have a helper for this? Reuse, do not duplicate.
- [ ] **Enforce DTO Validation**: Are all request body fields decorated with `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc.?
- [ ] **Verify Date & Time Handling**: Are dates calculated using the start and end of the day boundaries properly?
- [ ] **Review File Paths**: If handling uploads, are they stored under `uploads/` with a sanitized path?
- [ ] **Ensure Type Safety**: Are TypeScript types explicit? No `any` escapes unless interfacing with third-party untyped buffers.