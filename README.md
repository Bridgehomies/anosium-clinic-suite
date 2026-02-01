# Anosium Clinic Suite

**Anosium Clinic Suite** is a modern, full-featured **Clinic Management System (CMS)** built to simplify day-to-day healthcare operations. It centralizes patients, appointments, billing, pharmacy, and diagnostics into one fast, scalable platform.

The goal is simple:
**less admin work, better clinical flow, clearer data.**

---

## 🚀 What It Does

Anosium digitizes the entire clinic workflow—from appointment booking to diagnostics and final billing—so staff can focus on patients instead of paperwork.

It’s designed for:

* Small to mid-size clinics
* Multi-department practices
* Clinics that want structure without complexity

---

## ✨ Core Features

### 📊 Dashboard

* Real-time metrics
* Total patients, appointments, daily revenue
* Quick operational snapshot at login

### 👤 Patient Management

* Centralized digital patient records
* Personal details, medical history, visit tracking

### 📅 Appointment Scheduling

* Easy booking and rescheduling
* Status tracking: **Pending → Confirmed → Completed**

### 💳 Billing & Invoicing

* Automatic invoice generation
* Payment tracking
* Financial summaries and reports

### 💊 Pharmacy & Inventory

* Medicine stock management
* Expiry tracking
* Prescription handling

### 🔬 Laboratory & Radiology

* Diagnostic test result management
* Imaging and lab report integration

### 👨‍⚕️ Staff Management

* Doctor schedules
* Department assignments
* Role-based access control

### ⚙️ System Settings

* Clinic profile customization
* User permissions and access rules

---

## 🛠 Tech Stack

| Layer        | Tech         |
| ------------ | ------------ |
| Frontend     | React.js     |
| Build Tool   | Vite         |
| Styling      | Tailwind CSS |
| Package Mgmt | pnpm         |
| Icons        | Lucide React |

---

## 🏁 Getting Started

### Prerequisites

* Node.js **v18+**
* pnpm

```bash
npm install -g pnpm
```

---

### Installation

Clone the repository:

```bash
git clone https://github.com/Bridgehomies/anosium-clinic-suite.git
cd anosium-clinic-suite
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=your_api_endpoint
```

Run the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

---

## 📁 Project Structure

```plaintext
src/
├── components/     # Reusable UI components
├── pages/          # Application views (Dashboard, Patients, Billing)
├── hooks/          # Custom React hooks
├── context/        # Global state & authentication
├── assets/         # Images and static resources
└── utils/          # Helpers and API configurations
```

---

## 🔒 Security & Access Control

* Role-based access (Admin, Doctor, Staff)
* Controlled permissions per module
* Environment-based configuration support

> Backend authentication and API security depend on the connected server implementation.

---

## 🛣 Roadmap (Planned)

* ✅ Patient & appointment workflows
* ⏳ Notification system (SMS / Email)
* ⏳ Role-based analytics
* ⏳ Multi-clinic support
* ⏳ Audit logs & activity tracking

---

## 🤝 Contributing

Contributions are welcome and encouraged.

1. Fork the repository
2. Create your feature branch

   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add YourFeature"
   ```
4. Push to the branch

   ```bash
   git push origin feature/YourFeature
   ```
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.
See the `LICENSE` file for details.

---

## 👨‍💻 Developed By

**Bridgehomies**
Building practical software with clarity and purpose.

---
