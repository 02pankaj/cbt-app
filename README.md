# ⚡ Aquilon CBT System (Computer-Based Testing)

![Next.js](https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.x-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)

**Live Demo:** [https://cbt-app-pink.vercel.app](https://cbt-app-pink.vercel.app)

A high-performance, fully secure, and highly immersive Computer-Based Testing (CBT) platform built with **Next.js (App Router)** and **Firebase**.

Aquilon features a sleek, terminal-inspired UI, strict role-based access control via Edge Middleware, and a real-time data pipeline for instant assessment grading and telemetry.

---

## ✨ Core Features

### 🛡️ System & Security
* **Next.js Edge Middleware:** Impenetrable route security using secure cookies to prevent URL-hopping between User and Admin nodes.
* **Role-Based Authentication:** Seamless Google OAuth integration that dynamically routes users based on their database clearance level.
* **Cyberpunk Aesthetic:** Custom-built UI using Tailwind CSS featuring ambient blurs, glassmorphism, and holographic typography.

### 👨‍💻 Admin Command Center
* **Headless CMS Matrix:** Dynamically create, read, update, and delete Subjects and nested Topics on the fly.
* **Bulk Question Injection:** Custom CSV parser allowing admins to upload 100s of questions instantly via a downloadable template.
* **Global Telemetry Feed:** Real-time dashboard to monitor candidate submissions, auto-calculated accuracy percentages, and pass/fail metrics.

### 🎓 Candidate Assessment Terminal
* **Live Testing Interface:** State-retained exam node with visual progress tracking and custom interactive radio inputs.
* **Temporal Enforcement:** A strict countdown timer that automatically locks and submits the candidate's exam when time expires.
* **Historical Performance Log:** A dedicated student dashboard displaying past assessment results, dates, and final scores.

---

## 🏗️ Project Architecture

This project utilizes the Next.js App Router for highly optimized, nested layouts.

```text
src/
├── app/
│   ├── admin/dashboard/      # Protected Admin Command Center
│   │   ├── curriculum/       # Subject/Topic/Question CMS
│   │   ├── results/          # Global Telemetry Feed
│   │   └── users/            # Candidate Logs
│   ├── student/
│   │   ├── dashboard/        # Candidate Profile & History
│   │   └── test/[sub]/[top]/ # Dynamic Live Assessment Node
│   ├── layout.tsx            # Root HTML definition
│   └── page.tsx              # Secure Login Gateway
├── lib/
│   └── firebase.ts           # Firebase Initialization & Config
└── middleware.ts             # Edge Security & Route Protection
