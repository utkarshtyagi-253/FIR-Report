# 📄 AI-Powered FIR Report Management System

A full-stack web application designed to streamline the process of filing First Information Reports (FIRs). It leverages the **Gemini API** to automatically process user inputs and generate structured, detailed FIR descriptions for law enforcement and official record-keeping.

---

## ✨ Features

* **🤖 AI-Generated Descriptions:** Uses Google's Gemini API to turn plain text user complaints into structured, professional FIR reports.
* **📋 Record Management:** Easily log, view, and manage submitted FIR records (`records.html`).
* **📁 Modular Architecture:** Organized codebase separating frontend styling (`css/`), client scripts (`js/`), database models (`models/`), and backend API routing (`routes/`).
* **🌐 Intuitive Web UI:** Simple, accessible interface for submitting incident details and viewing reports.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Backend & API:** Node.js / Express (or Python) API routes
* **AI Integration:** Google Gemini API
* **Database:** MongoDB / SQL (via `models/`)

---

## 📂 Project Structure

```text
FIR-Report/
├── css/             # Custom stylesheets
├── js/              # Client-side scripts and API handlers
├── models/          # Database models / schemas
├── routes/          # API route endpoints
├── abcd.html        # Additional views / components
├── index.html       # Main landing and submission page
├── records.html     # View stored FIR records
└── README.md        # Project documentation
