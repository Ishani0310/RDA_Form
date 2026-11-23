# Road Development Authority (RDA) - Sri Lanka
## Inclusive Connectivity and Development Project (ICDP)
### Contractor & Supplier Data Collection System

[![Live Deployment](https://img.shields.io/badge/Live%20Deployment-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://rdaform-production.up.railway.app)
[![Status](https://img.shields.io/badge/Status-Active%20%2F%20Operational-success?style=for-the-badge)](https://rdaform-production.up.railway.app)

---

## 🌐 Live Production Links

- **Main Application:** [https://rdaform-production.up.railway.app](https://rdaform-production.up.railway.app)
- **Official Registration Form:** [https://rdaform-production.up.railway.app/register](https://rdaform-production.up.railway.app/register)
- **Admin Portal / Login:** [https://rdaform-production.up.railway.app/login](https://rdaform-production.up.railway.app/login)
- **Contractors Management:** [https://rdaform-production.up.railway.app/contractors](https://rdaform-production.up.railway.app/contractors)
- **Submissions Verification:** [https://rdaform-production.up.railway.app/submissions](https://rdaform-production.up.railway.app/submissions)
- **Health Endpoint:** [https://rdaform-production.up.railway.app/api/health](https://rdaform-production.up.railway.app/api/health)

---

## 📋 Overview

The **RDA Contractor & Supplier Data Collection System** is an enterprise web application designed for the **Road Development Authority (RDA)** under the Ministry of Transport, Highways and Urban Development, Sri Lanka, for the **Inclusive Connectivity and Development Project (ICDP)**.

It facilitates:
- Contractor qualification, CIDA grade validation, and specialty grading.
- Material supplier production capacities and location tracking.
- Prior similar work experience logging with financial sorting.
- Historical contract non-performance, pending litigation, and past litigation reporting (with multi-case declaration support).
- Financial performance schedules (5-year balance sheet & P&L statements).
- Instant multi-stage submission with automated official PDF receipts & acknowledgment emails via Gmail API / Resend.
- Administrative dossier generation, print layouts, and QR-verified tracking.

---

## 🚀 Key Features

- **Public Questionnaire / Registration Portal:**
  - Dynamic multi-step questionnaire tailored for Contractors and Material Suppliers.
  - Section 10 Historical Contract Non-Performance & Litigation with multi-case add/remove capabilities.
  - Instant local draft recovery and offline form persistence.
  - Client and server-side validation against CIDA registration rules.

- **Admin Management Portal:**
  - Contractor and supplier filtering by grade, specialty, and province.
  - Submissions review, audit trails, and status approvals.
  - Printable official dossiers and summaries.
  - Gmail API OAuth integration for email dispatch.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS, Lucide Icons
- **Database:** MongoDB / Mongoose
- **Email:** Gmail REST API (OAuth 2.0) & Resend fallback
- **Hosting / Deployment:** Railway ([rdaform-production.up.railway.app](https://rdaform-production.up.railway.app))

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/Ishani0310/RDA_Form.git

# Navigate into project directory
cd RDA_Form

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application locally.
