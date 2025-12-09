# Backend Listing - Car Marketplace Scraper Microservices

A production-ready microservices architecture for scraping, extracting, and serving car listings from Facebook Marketplace. Built with TypeScript, Node.js, and designed for scalability and reliability.

---

## 📑 Table of Contents

1. [Technologies Used](#-technologies-used)
2. [API Details](#-api-details)
3. [Architecture](#-architecture)
4. [Low Level Design](#-low-level-design)
5. [High Level Design](#-high-level-design)
6. [Important Decisions](#-important-decisions)
7. [Getting Started](#-getting-started)
8. [Environment Variables](#-environment-variables)
9. [Docker Commands](#-docker-commands)
10. [Monitoring & Debugging](#-monitoring--debugging)

---

## 🚀 Technologies Used

### **Core Technologies**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TypeScript** | 5.x | Type-safe development across all services |
| **Node.js** | 18.x | JavaScript runtime environment |
| **Express.js** | 4.x | REST API framework for ListingAPI |
| **PostgreSQL** | 16.x | Primary database for listings and jobs |
| **RabbitMQ** | 3.13.x | Message broker for inter-service communication |

### **Key Libraries & Frameworks**

#### **API Service (ListingAPI)**
- **Express.js** - RESTful API server
- **Knex.js** - SQL query builder and database migrations
- **Zod** - Schema validation for request/response
- **Winston** - Structured logging
- **amqplib** - RabbitMQ client
- **CORS** - Cross-origin resource sharing

#### **Seeder Service (ListingSeeder)**
- **Playwright** - Headless browser automation for discovery
- **amqplib** - RabbitMQ consumer for discovery jobs
- **Chromium** - Browser engine for web scraping

#### **Extractor Service (ListingExtractor)**
- **Playwright** - Headless browser automation for extraction
- **Knex.js** - PostgreSQL database operations
- **amqplib** - RabbitMQ consumer for extraction jobs

#### **Scheduler Service (ListingScheduler)**
- **Graphile Worker** - PostgreSQL-backed job queue
- **amqplib** - RabbitMQ publisher for job distribution
- **Cron** - Time-based job scheduling

### **Infrastructure**
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub** - Version control
- **npm Workspaces** - Monorepo management

### **Database Schema**
- **JSONB** - Flexible attribute storage
- **Triggers** - Automatic timestamp updates
- **Indexes** - Optimized queries on frequently searched columns
- **Constraints** - Data integrity with unique external IDs

---

## 📡 API Details

### **Base URL**
```
http://localhost:8080/api/v1
```

### **Endpoints**

#### **1. Get Listings**
Retrieve car listings with filtering, sorting, and pagination.

**Endpoint:** `GET /api/v1/listings`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `minPrice` | number | No | - | Minimum price filter |
| `maxPrice` | number | No | - | Maximum price filter |
| `yearMin` | number | No | - | Minimum year filter |
| `yearMax` | number | No | - | Maximum year filter |
| `vehicleType` | string | No | - | Filter by vehicle type (e.g., "Sedan", "SUV") |
| `location` | string | No | - | Filter by location |
| `sortBy` | string | No | createdAt | Sort column: `price`, `year`, `mileage`, `createdAt` |
| `sortOrder` | string | No | desc | Sort direction: `asc` or `desc` |

**Example Request:**
```bash
GET /api/v1/listings?minPrice=500000&maxPrice=1500000&yearMin=2018&sortBy=price&sortOrder=asc&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "externalId": "1234567890",
      "title": "2020 Toyota Fortuner",
      "price": 1200000,
      "currency": "PHP",
      "year": 2020,
      "mileage": 45000,
      "vehicleType": "SUV",
      "location": "Manila",
      "sourceUrl": "https://facebook.com/marketplace/item/1234567890",
      "description": "Well-maintained Toyota Fortuner...",
      "imageUrl": "https://example.com/image.jpg",
      "attributes": {
        "transmission": "Automatic",
        "fuelType": "Diesel"
      },
      "status": "active",
      "createdAt": "2025-12-09T10:30:00.000Z",
      "updatedAt": "2025-12-09T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "minPrice",
      "message": "Must be a positive number"
    }
  ]
}
```

---

#### **2. Trigger Discovery Job**
Manually trigger a discovery job to scrape new listings.

**Endpoint:** `POST /api/v1/jobs/trigger`

**Request Body:**
```json
{
  "url": "https://www.facebook.com/marketplace/manila/vehicles"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "jobId": "discovery_1733745600000",
    "message": "Discovery job triggered successfully"
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to trigger discovery job",
  "message": "RabbitMQ connection error"
}
```

---

#### **3. Health Check**
Check if the API service is running.

**Endpoint:** `GET /api/v1/health`

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T10:30:00.000Z",
  "service": "ListingAPI"
}
```

---

#### **4. Get Recent Jobs**
Retrieve recently created discovery jobs (internal monitoring).

**Endpoint:** `GET /api/v1/jobs/recent`

**Query Parameters:**
- `limit` (optional, default: 10): Number of jobs to retrieve

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "task_identifier": "trigger_discovery",
      "payload": {
        "url": "https://facebook.com/marketplace/manila/vehicles",
        "jobId": "discovery_1733745600000"
      },
      "run_at": "2025-12-09T10:00:00.000Z",
      "created_at": "2025-12-09T10:00:00.000Z"
    }
  ]
}
```

---

## 🏗️ Architecture

### **Microservices Overview**

The system consists of **4 independent microservices** that communicate via RabbitMQ message queues:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT / FRONTEND                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP REST API
                                 ▼
                        ┌──────────────────┐
                        │   ListingAPI     │ ◄──── Port 8080
                        │  (Express.js)    │
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │PostgreSQL│ │ RabbitMQ │ │Graphile  │
              │          │ │          │ │ Worker   │
              │  :5432   │ │  :5672   │ │(Postgres)│
              └─────┬────┘ └────┬─────┘ └────┬─────┘
                    │           │            │
         ┌──────────┼───────────┼────────────┼──────────┐
         │          │           │            │          │
         ▼          ▼           ▼            ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Listing │ │Listing │ │Listing │ │Listing │ │Listing │
    │Seeder  │ │Seeder  │ │Extract.│ │Extract.│ │Schedul.│
    │   #1   │ │   #2   │ │   #1   │ │   #2   │ │        │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
       ▼            ▼          ▼          ▼          │
    Playwright  Playwright Playwright Playwright    │
    (Chromium)  (Chromium) (Chromium) (Chromium)    │
                                                     ▼
                                            Cron Jobs (Hourly)
```

### **Service Responsibilities**

| Service | Purpose | Key Features |
|---------|---------|--------------|
| **ListingAPI** | REST API gateway | - Serve listings to clients<br>- Handle filters & pagination<br>- Trigger manual discovery jobs<br>- Query job status |
| **ListingSeeder** | Discovery service | - Scrape marketplace search pages<br>- Discover listing URLs<br>- Extract location from URLs<br>- Publish extraction jobs |
| **ListingExtractor** | Data extraction | - Scrape individual listing pages<br>- Extract detailed car information<br>- Validate and normalize data<br>- Store in PostgreSQL with upsert |
| **ListingScheduler** | Job scheduler | - Automated cron-based triggers<br>- Hourly discovery job execution<br>- Graphile Worker integration |

---

## 🔍 Low Level Design

### **1. Service-Level Architecture**

#### **ListingAPI Service**

```mermaid
graph TD
    A[HTTP Request] --> B[Express Server]
    B --> C{Route Handler}
    C -->|/listings| D[Listings Controller]
    C -->|/jobs/trigger| E[Jobs Controller]
    C -->|/health| F[Health Check]
    
    D --> G[Zod Validator]
    G --> H[Listings Service]
    H --> I[Knex Query Builder]
    I --> J[(PostgreSQL)]
    
    E --> K[Jobs Service]
    K --> L[RabbitMQ Publisher]
    L --> M{{Discovery Queue}}
    
    B --> N[Error Handler Middleware]
    N --> O[Logger Winston]
    
    style J fill:#326CE5
    style M fill:#FF6600
```

**Key Components:**
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic layer
- **Validators**: Zod schemas for request validation
- **Middleware**: Error handling, CORS, body parsing
- **Database Service**: Knex connection pool management
- **RabbitMQ Service**: Queue publishing with retry logic

---

#### **ListingSeeder Service**

```mermaid
graph LR
    A{{Discovery Queue}} --> B[RabbitMQ Consumer]
    B --> C[Job Processor]
    C --> D[Playwright Browser]
    D --> E[Marketplace Page]
    E --> F{Infinite Scroll}
    F -->|More listings| E
    F -->|Complete| G[Extract URLs]
    G --> H[Parse Location]
    H --> I[Create Extraction Jobs]
    I --> J[RabbitMQ Publisher]
    J --> K{{Extraction Queue}}
    
    C -->|ACK| B
    C -->|Error| L[NACK to DLX]
    
    style A fill:#FF6600
    style K fill:#FF6600
    style E fill:#1877F2
```

**Scraping Strategy:**
1. **Receive Discovery Job**: URL from RabbitMQ
2. **Launch Browser**: Headless Chromium via Playwright
3. **Navigate**: Facebook Marketplace search page
4. **Scroll**: Infinite scroll to load all listings
5. **Extract URLs**: Parse listing links from DOM
6. **Extract Location**: Parse from marketplace URL query params
7. **Publish Jobs**: Send each listing URL to extraction queue
8. **Acknowledge**: Confirm job completion to RabbitMQ

---

#### **ListingExtractor Service**

```mermaid
graph TD
    A{{Extraction Queue}} --> B[RabbitMQ Consumer]
    B --> C[Job Processor]
    C --> D[Validate External ID]
    D -->|Invalid| E[NACK to DLQ]
    D -->|Valid| F[Playwright Browser]
    F --> G[Listing Page]
    G --> H[Extract Data]
    
    H --> I[Parse Title]
    H --> J[Parse Price + Validation]
    H --> K[Parse Year]
    H --> L[Parse Mileage + k suffix]
    H --> M[Parse Description]
    H --> N[Extract Images]
    
    I --> O[Build Listing Object]
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O
    
    O --> P[Database Service]
    P --> Q{Check Duplicate}
    Q -->|Exists| R[UPDATE via externalId]
    Q -->|New| S[INSERT]
    R --> T[(PostgreSQL)]
    S --> T
    
    C -->|Success| U[ACK]
    C -->|Error| E
    
    style A fill:#FF6600
    style T fill:#326CE5
    style G fill:#1877F2
```

**Data Extraction Logic:**
- **Title**: Extract from page header
- **Price**: Regex parsing with validation (1K-100M PHP)
- **Year**: Numeric extraction from attributes
- **Mileage**: Parse with "k" multiplier support (140k → 140,000)
- **Description**: Full text content
- **Attributes**: JSONB storage for flexible fields
- **Images**: First available image URL

**Validation Rules:**
```typescript
Price: 1,000 ≤ price ≤ 100,000,000 PHP
Mileage: 0 < mileage ≤ 1,000,000 km
External ID: Must be extracted from URL (/item/[ID])
```

---

#### **ListingScheduler Service**

```mermaid
graph TD
    A[Graphile Worker] --> B[Load Crontab]
    B --> C{Cron Expression}
    C -->|0 * * * *| D[Every Hour at :00]
    
    D --> E[trigger_discovery Task]
    E --> F[Load SCRAPE_URL]
    F --> G[Create Job Payload]
    G --> H[RabbitMQ Publisher]
    H --> I{{Discovery Queue}}
    
    E --> J[Log Execution]
    J --> K[(PostgreSQL Jobs)]
    
    A --> L[Run Migrations]
    L --> M[Initialize Schema]
    
    style I fill:#FF6600
    style K fill:#326CE5
```

**Cron Configuration:**
```bash
# Crontab format: minute hour day month weekday
0 * * * * trigger_discovery {}  # Every hour at minute 0
```

**Task Execution Flow:**
1. Graphile Worker polls PostgreSQL for scheduled tasks
2. When cron time matches, execute `trigger_discovery`
3. Read `SCRAPE_URL` from environment
4. Create discovery job payload
5. Publish to RabbitMQ discovery queue
6. Log execution to database

---

### **2. Database Schema**

#### **Listings Table**
```sql
CREATE TABLE listings (
    id                  SERIAL PRIMARY KEY,
    external_id         VARCHAR(255) UNIQUE NOT NULL,  -- Deduplication key
    title               TEXT NOT NULL,
    price               NUMERIC(12, 2),                -- Max: 9,999,999,999.99
    currency            VARCHAR(3) DEFAULT 'PHP',
    year                INTEGER,
    mileage             INTEGER,                       -- In kilometers
    vehicle_type        VARCHAR(100),
    location            VARCHAR(255),
    source_url          TEXT UNIQUE NOT NULL,
    description         TEXT,
    image_url           TEXT,
    attributes          JSONB DEFAULT '{}',            -- Flexible storage
    status              VARCHAR(50) DEFAULT 'active',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_year ON listings(year);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_attributes ON listings USING GIN(attributes);
```

#### **Graphile Worker Tables** (Auto-created)
```sql
-- Job queue (managed by Graphile Worker)
graphile_worker.jobs (
    id, task_identifier, payload, run_at, 
    attempts, max_attempts, created_at, updated_at
)

-- Job execution history
graphile_worker.job_queues (
    queue_name, job_count, locked_at, locked_by
)
```

---

### **3. Message Queue Design**

#### **RabbitMQ Topology**

```
Exchange: discovery_exchange (direct)
    └─> Queue: discovery_queue
            ├─> DLX: discovery_dlx
            └─> DLQ: discovery_queue_dlq

Exchange: extraction_exchange (direct)
    └─> Queue: extraction_queue
            ├─> DLX: extraction_dlx
            └─> DLQ: extraction_queue_dlq
```

#### **Message Flow**

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant RMQ as RabbitMQ
    participant Seeder as Seeder
    participant Extractor as Extractor
    participant DB as PostgreSQL

    S->>RMQ: Publish discovery job
    Note over RMQ: discovery_queue
    
    RMQ->>Seeder: Consume message
    Seeder->>Seeder: Scrape marketplace
    Seeder->>RMQ: Publish 50 extraction jobs
    Note over RMQ: extraction_queue
    Seeder->>RMQ: ACK discovery job
    
    loop For each listing
        RMQ->>Extractor: Consume extraction job
        Extractor->>Extractor: Scrape listing details
        Extractor->>DB: Upsert listing
        Extractor->>RMQ: ACK extraction job
    end
    
    alt Error occurs
        Extractor->>RMQ: NACK (requeue=false)
        RMQ->>RMQ: Move to DLQ
    end
```

#### **Payload Structures**

**Discovery Job Payload:**
```typescript
{
  jobId: "discovery_1733745600000",
  url: "https://www.facebook.com/marketplace/manila/vehicles",
  createdAt: "2025-12-09T10:00:00.000Z"
}
```

**Extraction Job Payload:**
```typescript
{
  jobId: "extraction_1733745600123",
  url: "https://www.facebook.com/marketplace/item/1234567890",
  location: "Manila",
  createdAt: "2025-12-09T10:05:00.000Z"
}
```

---

### **4. Data Flow Diagram**

```mermaid
flowchart TB
    subgraph Trigger
        A1[Cron Job Hourly]
        A2[Manual API Call]
    end
    
    subgraph Discovery Phase
        B[Discovery Queue]
        C[ListingSeeder]
        D[Scrape Search Page]
        E[Extract 50 URLs]
    end
    
    subgraph Extraction Phase
        F[Extraction Queue]
        G[ListingExtractor x2]
        H[Scrape Listing Page]
        I[Validate & Parse Data]
    end
    
    subgraph Storage
        J[(PostgreSQL)]
        K{Duplicate Check}
        L[INSERT]
        M[UPDATE]
    end
    
    A1 --> B
    A2 --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K -->|New| L
    K -->|Exists| M
    L --> J
    M --> J
    
    style B fill:#FF6600
    style F fill:#FF6600
    style J fill:#326CE5
```

---

## 📐 High Level Design

### **1. System Architecture Diagram**

```mermaid
graph TB
    subgraph Client Layer
        UI[Web Frontend / Mobile App]
    end
    
    subgraph API Gateway
        API[ListingAPI :8080]
    end
    
    subgraph Message Broker
        RMQ[RabbitMQ :5672]
        RMQUI[RabbitMQ UI :15672]
    end
    
    subgraph Worker Services
        direction LR
        Seeder1[ListingSeeder #1]
        Seeder2[ListingSeeder #2]
        Extractor1[ListingExtractor #1]
        Extractor2[ListingExtractor #2]
    end
    
    subgraph Scheduler
        Scheduler[ListingScheduler]
        Cron[Cron: Hourly]
    end
    
    subgraph Data Layer
        PG[(PostgreSQL :5432)]
        PG_Tables[listings table<br/>graphile_worker tables]
    end
    
    subgraph External
        FB[Facebook Marketplace]
    end
    
    UI -->|HTTP REST| API
    API -->|Read| PG
    API -->|Publish| RMQ
    
    Scheduler -->|Cron Trigger| RMQ
    Cron -->|Every Hour| Scheduler
    Scheduler -->|Jobs Tracking| PG
    
    RMQ -->|discovery_queue| Seeder1
    RMQ -->|discovery_queue| Seeder2
    RMQ -->|extraction_queue| Extractor1
    RMQ -->|extraction_queue| Extractor2
    
    Seeder1 -->|Publish| RMQ
    Seeder2 -->|Publish| RMQ
    Seeder1 -.->|Scrape Search| FB
    Seeder2 -.->|Scrape Search| FB
    
    Extractor1 -->|Write| PG
    Extractor2 -->|Write| PG
    Extractor1 -.->|Scrape Listing| FB
    Extractor2 -.->|Scrape Listing| FB
    
    PG --> PG_Tables
    
    style UI fill:#E1F5FF
    style API fill:#4CAF50
    style RMQ fill:#FF6600
    style PG fill:#326CE5
    style FB fill:#1877F2
    style Scheduler fill:#9C27B0
```

---

### **2. Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Host                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Docker Compose Network                         │ │
│  │                 listing-network                             │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │listing-api   │  │listing-seeder│  │listing-      │    │ │
│  │  │              │  │              │  │extractor     │    │ │
│  │  │Node.js       │  │Playwright    │  │Playwright    │    │ │
│  │  │Express       │  │Chromium      │  │Chromium      │    │ │
│  │  │Port: 8080    │  │              │  │              │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                 │                  │             │ │
│  │         │   ┌─────────────┼──────────────────┘             │ │
│  │         │   │             │                                │ │
│  │  ┌──────▼───▼────┐  ┌────▼───────────┐  ┌──────────────┐ │ │
│  │  │listing-       │  │listing-        │  │listing-      │ │ │
│  │  │postgres       │  │rabbitmq        │  │scheduler     │ │ │
│  │  │              │  │                │  │              │ │ │
│  │  │PostgreSQL 16  │  │RabbitMQ 3.13   │  │Graphile      │ │ │
│  │  │Port: 5432     │  │Port: 5672      │  │Worker        │ │ │
│  │  │Volume: pgdata │  │Port: 15672(UI) │  │              │ │ │
│  │  └───────────────┘  └────────────────┘  └──────────────┘ │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Port Mappings:                                                 │
│  - 8080:8080  → API                                             │
│  - 5432:5432  → PostgreSQL                                      │
│  - 5672:5672  → RabbitMQ                                        │
│  - 15672:15672 → RabbitMQ Management UI                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### **3. Scalability Design**

#### **Horizontal Scaling**

```mermaid
graph LR
    subgraph Load Balancer
        LB[Nginx / ALB]
    end
    
    subgraph API Tier
        API1[ListingAPI #1]
        API2[ListingAPI #2]
        API3[ListingAPI #3]
    end
    
    subgraph Worker Tier - Seeder
        S1[Seeder #1]
        S2[Seeder #2]
        S3[Seeder #3]
    end
    
    subgraph Worker Tier - Extractor
        E1[Extractor #1]
        E2[Extractor #2]
        E3[Extractor #3]
        E4[Extractor #4]
        E5[Extractor #5]
    end
    
    subgraph Data Layer
        DB[(PostgreSQL<br/>Read Replica)]
        DBM[(PostgreSQL<br/>Master)]
        Cache[(Redis Cache)]
    end
    
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Cache
    API2 --> Cache
    API3 --> Cache
    Cache -.->|Cache Miss| DB
    
    API1 --> DBM
    API2 --> DBM
    API3 --> DBM
    
    S1 --> E1
    S1 --> E2
    S2 --> E3
    S2 --> E4
    S3 --> E5
    
    E1 --> DBM
    E2 --> DBM
    E3 --> DBM
    E4 --> DBM
    E5 --> DBM
    
    style LB fill:#607D8B
    style Cache fill:#FF5722
    style DBM fill:#326CE5
    style DB fill:#64B5F6
```

**Scaling Strategy:**
- **API Layer**: Stateless, scale horizontally with load balancer
- **Seeder Workers**: Scale based on discovery job volume
- **Extractor Workers**: Scale to 5-10 instances for parallel extraction
- **Database**: Read replicas for queries, master for writes
- **Cache**: Redis for frequently accessed listings

---

### **4. Fault Tolerance & Reliability**

```mermaid
graph TD
    A[Message Published] --> B{Service Available?}
    B -->|Yes| C[Process Job]
    B -->|No| D[Retry 3x]
    
    C --> E{Processing Success?}
    E -->|Yes| F[ACK Message]
    E -->|No| G[NACK Message]
    
    D --> H{Max Retries?}
    H -->|No| B
    H -->|Yes| G
    
    G --> I[Move to DLQ]
    I --> J[Manual Review]
    
    F --> K[Job Complete]
    
    style I fill:#FF5252
    style F fill:#4CAF50
    style J fill:#FFC107
```

**Reliability Features:**
- **Message Persistence**: RabbitMQ durable queues
- **Dead Letter Queue**: Failed jobs moved to DLQ for investigation
- **Graceful Shutdown**: Services handle SIGTERM/SIGINT properly
- **Database Constraints**: Unique constraints prevent duplicates
- **Retry Logic**: Exponential backoff for transient failures
- **Health Checks**: Docker health checks ensure service availability

---

### **5. Monitoring & Observability**

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Logs                    Metrics                Tracing     │
│  ├─ Winston Logger       ├─ RabbitMQ Stats     ├─ Jaeger   │
│  ├─ Centralized Format   ├─ DB Conn Pool       └─ OpenTel  │
│  └─ JSON Output          └─ Queue Depth                     │
│                                                              │
│  Dashboards              Alerts                             │
│  ├─ RabbitMQ UI          ├─ Queue Depth > 1000             │
│  ├─ PostgreSQL Stats     ├─ DLQ Messages > 50              │
│  └─ Custom API Metrics   └─ Service Down > 5min            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Metrics:**
- **API**: Request rate, response time, error rate
- **Workers**: Jobs processed/sec, success rate, queue lag
- **Database**: Connection pool usage, query performance
- **RabbitMQ**: Queue depth, message rate, consumer count

---

## 🎯 Important Decisions

### **1. Microservices Architecture**

**Decision:** Adopt microservices instead of monolithic architecture.

**Rationale:**
- **Separation of Concerns**: Each service has a single responsibility
  - API: Serving data
  - Seeder: Discovery
  - Extractor: Data extraction
  - Scheduler: Job orchestration
  
- **Independent Scaling**: Scale services based on workload
  - Extractors can scale to 10+ instances during high volume
  - API can scale independently for read traffic
  
- **Technology Flexibility**: Each service can use optimal tools
  - Playwright for scraping
  - Graphile Worker for scheduling
  
- **Fault Isolation**: One service failure doesn't crash entire system

**Trade-offs:**
- ❌ Increased operational complexity
- ❌ More network overhead
- ✅ Better scalability and maintainability

---

### **2. RabbitMQ as Message Broker**

**Decision:** Use RabbitMQ instead of direct HTTP calls or database polling.

**Rationale:**
- **Decoupling**: Services don't need to know about each other
- **Load Balancing**: Multiple workers automatically balance load
- **Retry Mechanism**: Built-in message requeue and DLQ
- **Reliability**: Message persistence ensures no job loss
- **Backpressure Handling**: Prefetch control prevents worker overload

**Alternative Considered:**
- Redis Pub/Sub: ❌ No message persistence, no requeue
- Kafka: ❌ Overkill for this scale, higher complexity
- AWS SQS: ❌ Vendor lock-in, not self-hosted

---

### **3. PostgreSQL Over NoSQL**

**Decision:** Use PostgreSQL for primary data storage.

**Rationale:**
- **Structured Data**: Car listings have well-defined schema
- **ACID Compliance**: Critical for deduplication (unique constraints)
- **Complex Queries**: Support for filters, joins, aggregations
- **JSONB Support**: Flexible storage for varying attributes
- **Mature Ecosystem**: Knex, Graphile Worker, extensive tooling

**JSONB for Attributes:**
- Store flexible fields (transmission, fuel type, features)
- Avoid schema migrations for new attributes
- GIN index for fast JSONB queries

**Alternative Considered:**
- MongoDB: ❌ Less suitable for complex queries and transactions
- MySQL: ✅ Viable, but PostgreSQL has better JSONB support

---

### **4. Playwright for Web Scraping**

**Decision:** Use Playwright instead of Puppeteer or Axios/Cheerio.

**Rationale:**
- **JavaScript Rendering**: Facebook Marketplace is fully client-side rendered
- **Modern Browser API**: Async/await, auto-wait for elements
- **Cross-Browser**: Chromium, Firefox, WebKit support
- **Stealth Features**: Better at avoiding detection
- **Active Development**: Microsoft-backed, frequent updates

**Why Not:**
- Puppeteer: ✅ Similar, but Playwright has better API
- Axios + Cheerio: ❌ Cannot render JavaScript
- Selenium: ❌ Slower, more complex setup

---

### **5. Graphile Worker for Scheduling**

**Decision:** Use Graphile Worker instead of node-cron or Bull.

**Rationale:**
- **PostgreSQL-Backed**: No additional infrastructure (Redis)
- **Reliability**: Jobs persisted in database, survives crashes
- **Cron Scheduling**: Built-in crontab support
- **Idempotency**: Easy deduplication with job keys
- **Monitoring**: Query job status directly from database

**Alternative Considered:**
- Bull/BullMQ: ❌ Requires Redis, more moving parts
- node-cron: ❌ In-memory, not persistent, single instance
- AWS EventBridge: ❌ Vendor lock-in

---

### **6. Deduplication Strategy**

**Decision:** Two-layer deduplication using external ID and upsert.

**Implementation:**
```sql
external_id VARCHAR(255) UNIQUE NOT NULL
```

```typescript
// Application-level upsert
await db('listings')
  .insert(listing)
  .onConflict('external_id')
  .merge();
```

**Rationale:**
- **Database Constraint**: Prevents duplicate inserts at DB level
- **Upsert Logic**: Updates existing listings with new data
- **External ID**: Facebook's item ID is stable and unique
- **No Race Conditions**: Database handles concurrent inserts

**Why This Approach:**
- ✅ Handles re-scraping same listing
- ✅ Updates price/description changes
- ✅ No manual duplicate checking needed
- ✅ Atomic operation at database level

---

### **7. Direct SQL Query Parameters**

**Decision:** API parameters match database column names (camelCase).

**Before:**
```typescript
// Mapping overhead
const params = {
  min_price: req.query.minPrice,
  max_price: req.query.maxPrice
};
```

**After:**
```typescript
// Direct mapping
const { minPrice, maxPrice } = req.query;
query.where('price', '>=', minPrice);
```

**Rationale:**
- **Less Code**: No mapping layer needed
- **Better Performance**: Direct query building
- **Clearer API**: Consistent naming convention
- **Type Safety**: TypeScript interfaces align with DB schema

---

### **8. Validation Ranges for Numeric Fields**

**Decision:** Strict validation for price and mileage to prevent overflow.

**Implementation:**
```typescript
// Price validation
if (price >= 1000 && price <= 100000000) {
  // Valid range: ₱1K - ₱100M
}

// Mileage validation
if (mileage > 0 && mileage <= 1000000) {
  // Valid range: 1 - 1M km
}
```

**Rationale:**
- **Prevent DB Errors**: `numeric field overflow` on invalid data
- **Data Quality**: Filter out parsing errors (phone numbers as price)
- **Realistic Bounds**: 100M PHP max covers luxury cars
- **Error Handling**: Invalid data sent to DLQ, not database

**Why These Limits:**
- Price: 1K minimum (₱1,000), 100M maximum (₱100,000,000)
- Mileage: 1M km maximum (highly used commercial vehicles)

---

### **9. Location Passed from Seeder**

**Decision:** Extract location in Seeder, pass to Extractor via payload.

**Flow:**
```
Marketplace URL: /manila/vehicles
    ↓ [Seeder extracts "manila"]
Payload: { url: "...", location: "Manila" }
    ↓ [RabbitMQ]
Extractor receives location in payload
```

**Rationale:**
- **Reliability**: Location in URL is accurate
- **Efficiency**: No need to parse listing page for location
- **Consistency**: All listings from same search have same location
- **Fallback**: Listing page location often missing or ambiguous

**Alternative Rejected:**
- Scrape from listing page: ❌ Unreliable, often missing
- User input: ❌ Not available in automated scraping

---

### **10. Hourly Cron Schedule**

**Decision:** Run discovery jobs every hour at minute 0.

**Cron Expression:**
```bash
0 * * * * trigger_discovery {}
```

**Rationale:**
- **Fresh Data**: New listings appear throughout the day
- **Rate Limiting**: Avoid aggressive scraping
- **Resource Usage**: Balanced between freshness and cost
- **Facebook Limits**: Avoid triggering anti-bot measures

**Configurable:**
- Can adjust to `*/30 * * * *` (every 30 min) for higher frequency
- Can reduce to `0 */2 * * *` (every 2 hours) for lower load

---

### **11. Docker Healthcheck Start Period**

**Decision:** Add `start_period` to PostgreSQL (30s) and RabbitMQ (60s).

**Configuration:**
```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U test1 -d listingdb"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s  # Grace period for initialization

rabbitmq:
  healthcheck:
    test: ["CMD-SHELL", "rabbitmq-diagnostics -q ping"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 60s  # RabbitMQ needs more time
```

**Rationale:**
- **Avoid False Failures**: Services need time to initialize
- **Erlang Cookie Setup**: RabbitMQ initialization is slow
- **Database Migrations**: PostgreSQL needs time for schema setup
- **Dependent Services**: API and workers wait for healthy deps

---

### **12. Environment-Based Configuration**

**Decision:** All configuration via environment variables, no hardcoded values.

**Benefits:**
- **12-Factor App**: Follow cloud-native best practices
- **Security**: Sensitive data (passwords) not in code
- **Flexibility**: Different configs for dev/staging/prod
- **Docker Integration**: Easy to configure via compose

**Key Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
RABBITMQ_URL=amqp://user:pass@host:5672
SCRAPE_URL=https://facebook.com/marketplace/manila/vehicles
API_PORT=8080
NODE_ENV=production
```

---

## 🚀 Getting Started

### **Prerequisites**
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum (16GB recommended)
- 20GB disk space

### **Quick Start**

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend-listing
```

2. **Create `.env` file**
```bash
# Database
POSTGRES_USER=test1
POSTGRES_PASSWORD=test1
POSTGRES_DB=listingdb
DATABASE_URL=postgresql://test1:test1@listing-postgres:5432/listingdb

# RabbitMQ
RABBITMQ_USER=test1
RABBITMQ_PASSWORD=test1
RABBITMQ_URL=amqp://test1:test1@listing-rabbitmq:5672

# Scraping
SCRAPE_URL=https://www.facebook.com/marketplace/manila/vehicles
FACEBOOK_USERNAME=your_facebook_email
FACEBOOK_PASSWORD=your_facebook_password

# API
API_PORT=8080
NODE_ENV=production
```

3. **Start all services**
```bash
docker compose up -d
```

4. **Check service health**
```bash
docker compose ps
```

5. **Access services**
- API: http://localhost:8080/api/v1/listings
- RabbitMQ UI: http://localhost:15672 (guest/guest)
- PostgreSQL: localhost:5432 (test1/test1)

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | Yes | test1 | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | test1 | PostgreSQL password |
| `POSTGRES_DB` | Yes | listingdb | Database name |
| `DATABASE_URL` | Yes | - | Full PostgreSQL connection URL |
| `RABBITMQ_USER` | Yes | test1 | RabbitMQ username |
| `RABBITMQ_PASSWORD` | Yes | test1 | RabbitMQ password |
| `RABBITMQ_URL` | Yes | - | Full RabbitMQ connection URL |
| `SCRAPE_URL` | Yes | - | Facebook Marketplace URL to scrape |
| `FACEBOOK_USERNAME` | Optional | - | Facebook login email (if auth required) |
| `FACEBOOK_PASSWORD` | Optional | - | Facebook login password |
| `API_PORT` | No | 8080 | Port for ListingAPI |
| `NODE_ENV` | No | development | Environment: development/production |

---

## 🐳 Docker Commands

### **Start Services**
```bash
# Start all services in detached mode
docker compose up -d

# Start specific service
docker compose up -d listing-api

# Start with build
docker compose up -d --build
```

### **Stop Services**
```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

### **View Logs**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f listing-api
docker compose logs -f listing-extractor

# Last 100 lines
docker compose logs --tail=100 listing-seeder
```

### **Restart Services**
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart listing-scheduler
```

### **Check Status**
```bash
# Service status
docker compose ps

# Resource usage
docker stats

# Service health
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### **Execute Commands**
```bash
# Access PostgreSQL
docker compose exec listing-postgres psql -U test1 -d listingdb

# Check RabbitMQ queues
docker compose exec listing-rabbitmq rabbitmqctl list_queues

# Access service shell
docker compose exec listing-api sh
```

### **Rebuild Services**
```bash
# Rebuild specific service
docker compose build listing-api

# Rebuild all services
docker compose build

# No cache rebuild
docker compose build --no-cache
```

---

## 📊 Monitoring & Debugging

### **RabbitMQ Management UI**
- URL: http://localhost:15672
- Default credentials: `guest` / `guest`
- Monitor queues, exchanges, message rates

### **Database Queries**
```sql
-- Check total listings
SELECT COUNT(*) FROM listings;

-- Recent listings
SELECT * FROM listings ORDER BY created_at DESC LIMIT 10;

-- Check duplicates
SELECT external_id, COUNT(*) FROM listings GROUP BY external_id HAVING COUNT(*) > 1;

-- Queue jobs (Graphile Worker)
SELECT * FROM graphile_worker.jobs ORDER BY created_at DESC LIMIT 10;
```

### **Logs Analysis**
```bash
# Search for errors
docker compose logs | grep -i "error"

# Check specific service errors
docker compose logs listing-extractor | grep "ERROR"

# Monitor real-time
docker compose logs -f --tail=50
```

### **Health Checks**
```bash
# API health
curl http://localhost:8080/api/v1/health

# PostgreSQL health
docker compose exec listing-postgres pg_isready

# RabbitMQ health
docker compose exec listing-rabbitmq rabbitmqctl status
```

---

## 📈 Performance Optimization

### **Scaling Workers**
```yaml
# docker-compose.yml
listing-extractor:
  # ... existing config
  deploy:
    replicas: 5  # Scale to 5 instances
```

### **Database Indexing**
Already implemented indexes on:
- `price`, `year`, `location`, `created_at`, `status`
- JSONB attributes (GIN index)

### **Caching Layer** (Future Enhancement)
- Add Redis for frequently accessed listings
- Cache API responses with TTL
- Invalidate cache on updates

---

## 🛠️ Troubleshooting

### **Service Won't Start**
```bash
# Check logs
docker compose logs listing-api

# Check dependencies
docker compose ps listing-postgres listing-rabbitmq

# Restart services
docker compose restart
```

### **RabbitMQ Connection Errors**
```bash
# Verify RabbitMQ is healthy
docker compose exec listing-rabbitmq rabbitmqctl status

# Check user permissions
docker compose exec listing-rabbitmq rabbitmqctl list_users
```

### **Database Connection Issues**
```bash
# Test connection
docker compose exec listing-postgres psql -U test1 -d listingdb -c "SELECT 1;"

# Check running queries
docker compose exec listing-postgres psql -U test1 -d listingdb -c "SELECT * FROM pg_stat_activity;"
```

### **Port Already in Use**
```bash
# Find process using port 8080
lsof -i :8080

# Change port in .env
API_PORT=8081
```

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Contributors

Developed by the Platform - Car Service Team

---

## 📞 Support

For issues and questions, please open a GitHub issue or contact the development team.

