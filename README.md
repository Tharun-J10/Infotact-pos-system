# 🛒 Infotact POS - Enterprise Point of Sale System

A full-stack MERN (MongoDB, Express, React, Node.js) application designed for modern retail management. This system provides a seamless experience for both cashiers and managers, featuring real-time inventory tracking, secure authentication, and live sales analytics.

---

## 🚀 Key Features

### 💻 Cashier Terminal
* **Dynamic Product Grid:** Searchable interface with real-time stock status.
* **Smart Cart Management:** Powered by Redux for fast, client-side state handling.
* **Tender Calculator:** Integrated modal to calculate change due and process payments.
* **Digital Receipts:** Generates clean, printable invoices for every transaction.

### 📈 Manager Dashboard
* **Inventory Control:** Add, edit, and monitor stock levels directly from the UI.
* **Sales Analytics:** Live revenue feed and transaction history for the current session.
* **Staff Management:** Securely register new Cashier or Manager accounts.
* **Refund System:** One-click transaction cancellation with automatic inventory restocking.

---

## 🛠️ Tech Stack

**Frontend:**
* **React.js:** Component-based UI architecture.
* **Redux Toolkit:** Global state management for the shopping cart.
* **Tailwind CSS:** Professional, responsive styling.
* **Axios:** For robust API communication.

**Backend:**
* **Node.js & Express:** Scalable server-side logic.
* **MongoDB:** NoSQL database for flexible data modeling.
* **Mongoose:** Object Data Modeling (ODM).
* **JWT (JSON Web Tokens):** Secure, stateless authentication.

---

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/Infotact-pos-system.git](https://github.com/YOUR_USERNAME/Infotact-pos-system.git)
cd Infotact-pos-system

Backend Setup

Bash
cd backend
npm install

Create a .env file in the backend folder:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

Start the server: npm start

3. Frontend Setup
Bash
cd ../frontend
npm install
npm run dev


🛡️ Security Features
Role-Based Access Control (RBAC): Only Managers can access inventory and staff settings.

Protected Routes: API endpoints secured via JWT middleware.

Data Sanitization: Strict validation for inventory and user inputs.

👥 Authors
Tharun J - Lead Developer / Team Lead - GitHub Profile

Jahnavi - Collaborator

© 2026 Infotact Security POS System


---

