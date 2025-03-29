# 🚀 Free-Gency Backend

## 🌟 Overview

Free-Gency is a platform that connects **clients with freelance teams**, providing an integrated environment for collaboration and management of creative and technical projects. The platform allows clients to discover opportunities and contract with specialized teams in various fields such as design, development, marketing, and IT services.

---

## 🌍 Deployment

The project is deployed using **Heroku** at the following link:
🔗 https://free-gency-api.herokuapp.com

### 🌐 Access the Live Application

```sh
🔗 https://free-gency-api.herokuapp.com
```

### 📩 Postman API Collection

You can test the API using **Postman Workspace**:

🔗 [Postman Workspace](https://gradutrion-team.postman.co/workspace/Free-Gancy-API~13a47391-c795-4844-ace8-fa92c549ef68/collection/34651419-8bec1b05-9ea9-40e2-b9bf-e38f5ef1e5e1?action=share&source=collection_link&creator=34651419)

---

## 🔥 Features

✅ **Secure Authentication System**: Login, registration, email verification, password recovery
✅ **User Management**: Clients, team leaders, team members
✅ **Team Management**: Create, manage, and join teams
✅ **Project Management**: Create, track, and manage projects
✅ **Service Categories**: Creative design, development & programming, advertising & marketing, IT services
✅ **Profile Management**: Update profiles, skills, and portfolio
✅ **Reviews & Ratings**: Rating system for teams and projects

---

## 🛠 Technologies Used

### ⚙ **Backend**

- 🟢 **Node.js**
- ⚡ **Express.js**

### 💾 **Database**

- 🍃 **MongoDB**
- 🔴 **Mongoose**

### 🔒 **Authentication**

- 🔑 **JWT** (JSON Web Tokens)
- 🔐 **bcrypt**

### 📧 **Notifications**

- 📨 **Nodemailer**

### 🔧 **Validation**

- ✅ **Validator.js**
- 🛡️ **Express Validator**

### 📦 **Other Tools**

- 🔴 **Postman** _(API Testing)_

### 🚀 **Deployment**

- ☁️ **Heroku** _(Hosting Service)_

---

## ⚡ Installation

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/yourusername/Free-Gency-Backend.git
cd Free-Gency-Backend
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Set Up Environment Variables

Create a `config/config.env` file in the project directory and configure the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret
JWT_EXPIRE_TIME=3d

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

⚠ **Make sure not to share these credentials publicly and add `config/config.env` to `.gitignore`.**

### 4️⃣ Run the Application

```sh
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The server will run at `http://localhost:8000`.

---

## 📌 API Endpoints

### **Authentication Routes** (`/api/v1/auth`)

| Method | Endpoint             | Description                    |
| ------ | -------------------- | ------------------------------ |
| `POST` | `/signup`            | Register a new user            |
| `POST` | `/signup-team`       | Create a team with team leader |
| `POST` | `/login`             | Login user                     |
| `GET`  | `/verify/:token`     | Confirm email verification     |
| `POST` | `/resend-email`      | Resend verification email      |
| `POST` | `/forgot-password`   | Request password reset         |
| `POST` | `/verify-reset-code` | Verify reset code              |
| `POST` | `/reset-password`    | Reset password                 |

### **User Routes** (`/api/v1/users`)

| Method   | Endpoint | Description                    |
| -------- | -------- | ------------------------------ |
| `GET`    | `/`      | Get all users                  |
| `POST`   | `/`      | Create a new user (Admin only) |
| `GET`    | `/:id`   | Get a specific user            |
| `PUT`    | `/:id`   | Update a specific user         |
| `DELETE` | `/:id`   | Delete a specific user         |

### **Teams Routes** (`/api/v1/teams`)

Coming soon...

### **Projects Routes** (`/api/v1/projects`)

Coming soon...

---

## 📱 UI Screenshots

The project includes a beautifully designed mobile interface:

### Splash Screens

Welcome screens showcasing the brand identity with a modern purple theme and creative elements.

### Onboarding Screens

Introduction to key features with four main onboarding screens:

- **Welcome to Freegency**: Connecting clients with agencies and teams
- **Seamless Collaboration**: Simple communication and project execution
- **Discover Opportunities**: Browse available talent and find the right team
- **Trusted Transactions**: Secure payment processing and transparent reviews

### Authentication Screens

- User login
- Registration
- Password recovery
- OTP verification

### Client Home

- Notifications feed
- Team listings
- Projects dashboard

### Service Categories

- Creative & Visual
- Advertising & Marketing
- Development & Product
- IT Services

---

## ⚠ Error Handling

The application supports **global error handling** for:

- ❌ **Unhandled Promise Rejections**
- ❌ **Uncaught Exceptions**
- ❌ **Invalid Routes**
- ❌ **Validation Errors**

---

## 🤝 Contributing

Contributions are welcome! Feel free to **fork** the repository and submit **pull requests**.

---

## 📜 License

This project is licensed under the **MIT License**.

---
