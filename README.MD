# SIBA Gigs - Campus Freelancing Marketplace

An elite, high-performance campus freelancing portal tailor-made for the **Sukkur IBA University** ecosystem. This system orchestrates decentralized transaction pipelines, automated matching protocols, micro-payment ledgers, and live audit channels between Students (Clients) and Freelancers (Campus Service Providers).

---

## 🚀 Key Functional Modules

1. **Dynamic Task Feed & Escrow System**
   * Students post real-time gigs with budget limits in Pakistani Rupees (PKR).
   * Verified freelancers bid dynamically on active projects.
   * Safety mechanisms block double-spending or malicious modifications.

2. **Fintech Core Integration (Simulated Sandbox)**
   * Multi-gateway micro-deposits supporting **EasyPaisa, JazzCash, NayaPay, and Bank Transfers**.
   * Transparent step-by-step verification pipeline with high-visibility audit logs.
   * Instant cash-out (withdrawal) system for freelancers with absolute state-synchronization.

3. **SIBA Control Center Admin Panel**
   * Secure, backdoor-authenticated operations board (`/admin-portal-siba`).
   * Dual auditing arrays for processing manual ledger confirmations.

---

## 🛠️ Technical Architecture & Requirements

### 💻 Frontend Tech Stack
* **Core Framework:** React 18+ (Vite Bundler Engine)
* **Styling Framework:** Tailwind CSS (Custom Dark Theme Configuration)
* **State Management:** React Context API (Asynchronous Global Handshakes)
* **Network Client:** Axios HTTP / Fetch API Pipeline Architecture
* **Notification Layer:** React Hot Toast Engine

### ⚙️ Backend Tech Stack
* **Runtime Environment:** Node.js (V8 Execution Network)
* **Application Framework:** Express.js 
* **Database Management:** MongoDB Cloud Cluster Architecture via Mongoose ODM
* **File Stream Processor:** Multer Middleware (Voucher Storage Strategy)
* **Authentication Layer:** JSON Web Tokens (JWT) + Cryptographic Salt-Hashing

---

## 📦 Core Directory Structure

```text
SIBA-Gigs/
├── server/                   # Backend Production Architecture
│   ├── config/               # Database Network Handshakes
│   ├── controllers/          # Financial Ledger & Business Controllers
│   ├── middleware/           # Token Shielding & Authorization Middleware
│   ├── models/               # MongoDB Mongoose Strict Schema Matrix
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Deposit.js        # Formalized Audit-Receipt Document
│   │   └── Withdrawal.js
│   ├── routes/               # Express Decoupled Routing Channels
│   └── uploads/vouchers/     # Cryptographic Transaction Screenshot Vault
│
└── client/                   # Frontend User Experience Layers
    ├── src/
    │   ├── components/       # Reusable Modules (Navbar, Dynamic Modals)
    │   ├── context/          # Auth & Real-Time Sync Provider 
    │   ├── pages/            # View-Port Layers (Dashboard, Admin Control)
    │   └── App.jsx           # Client Route Mapping Controller