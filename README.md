# 🌌 CelestialGallery - Hackathon 2025 Project

**CelestialGallery** is a full-stack web application developed during the 2025 Hackathon to enable users to upload, share, and explore stunning astronomy images. It features user registration, secure login, image uploads with descriptions, and interactive functionalities like liking and reporting images.

---

## 🚀 Features

- **User Authentication:** Register, login, and logout securely.
- **Image Uploads:** Upload celestial images with titles and descriptions.
- **Gallery View:** Browse all uploaded images with uploader info.
- **Interaction:** Like images and report inappropriate content (auto-removal after 5 reports).
- **My Uploads:** View and manage your own images.
- **Responsive Design:** Optimized for desktop and mobile devices.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** HTML, CSS, JavaScript
- **Authentication:** express-session, bcrypt
- **File Uploads:** multer
- **Security:** helmet, express-mongo-sanitize
- **Environment Management:** dotenv
- **File System:** fs

---

## 📝 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/umamanipraharshitha/CelestialGallery.git
   cd CelestialGallery
2. **Install dependencies**
   ```bash
   npm install
3. **Set up environment variables**

Create a `.env` file in the root directory:

    MONGO_URI=your_mongodb_connection_string
    SESSION_SECRET=your_session_secret
4. **Create uploads folder**
    ```bash
    mkdir -p public/uploads
5. **Start the server**
   ```bash
   npm start
  The app will run at [http://localhost:3000](http://localhost:3000).

---

## 🖼️ Usage

- Register a new account or log in.
- Upload your astronomy images.
- Like and report images in the gallery.
- View and manage your uploads in the "My Uploads" section.

---

## 🛡️ Security Notes

- Passwords are hashed with bcrypt.
- User input is sanitized and HTTP headers are secured.
- Sessions are protected and sensitive data is never committed.

---

