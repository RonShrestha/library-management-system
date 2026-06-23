# Library Management System

A modern web application for managing library operations including user authentication, book management, and borrowing records.

## Project Overview

This Library Management System is built with:
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python Flask
- **Database**: SQLite

## Features

### Current Implementation
- ✅ Homepage with feature showcase
- ✅ User authentication (Login & Signup)
- ✅ Secure password hashing
- ✅ Session management
- ✅ Dashboard for authenticated users
- ✅ Responsive design
- ✅ Form validation (client-side and server-side)
- ✅ Error handling and user feedback

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

#### Books Table
```sql
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(120) NOT NULL,
    isbn VARCHAR(13) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1,
    available_quantity INTEGER DEFAULT 1,
    published_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Borrow Records Table
```sql
CREATE TABLE borrow_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME,
    status VARCHAR(20) DEFAULT 'borrowed',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);
```

## Installation

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/RonShrestha/library-management-system.git
   cd library-management-system
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\\Scripts\\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   Open your browser and navigate to: `http://localhost:5000`

## Project Structure

```
library-management-system/
├── app.py                    # Flask application and database models
├── requirements.txt          # Python dependencies
├── README.md                # Project documentation
├── templates/
│   ├── base.html           # Base template
│   ├── index.html          # Homepage
│   ├── login.html          # Login page
│   ├── signup.html         # Signup page
│   └── dashboard.html      # Dashboard (protected)
└── static/
    ├── css/
    │   └── style.css       # Styling
    └── js/
        └── script.js       # JavaScript utilities
```

## Usage

### Homepage
- View information about the library system
- Access login and signup links

### Sign Up
1. Click "Sign Up" on the homepage
2. Fill in your details:
   - Full Name
   - Username (3-20 characters)
   - Email
   - Password (minimum 6 characters)
3. Click "Create Account"

### Login
1. Click "Login" on the homepage
2. Enter your username and password
3. Click "Login" to access your dashboard

### Dashboard
- View personalized welcome message
- Access book management features (to be implemented)
- View borrowing history (to be implemented)

## API Endpoints

### Authentication
- `GET /` - Homepage
- `GET /login` - Login page
- `POST /login` - Submit login form
- `GET /signup` - Signup page
- `POST /signup` - Submit signup form
- `GET /logout` - Logout user

### Protected Routes
- `GET /dashboard` - User dashboard
- `GET /api/user/profile` - Get user profile (JSON)

## Security Features

1. **Password Hashing**: Passwords are hashed using Werkzeug's security functions
2. **Session Management**: Flask sessions for user authentication
3. **Form Validation**: Both client-side and server-side validation
4. **CSRF Protection**: Ready to implement (can add Flask-WTF)
5. **SQL Injection Prevention**: Using SQLAlchemy ORM

## Future Enhancements

- [ ] Book management (Add, Edit, Delete, View)
- [ ] Search and filter books
- [ ] Borrowing system
- [ ] Return book functionality
- [ ] User profile management
- [ ] Admin panel
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Book reviews and ratings
- [ ] Database backups

## Technologies Used

- **Backend**: Flask 2.3.2
- **Database ORM**: Flask-SQLAlchemy 3.0.5
- **Security**: Werkzeug 2.3.6
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: SQLite

## File Descriptions

### app.py
- Flask application initialization
- Database model definitions
- Route handlers
- API endpoints

### templates/
- **base.html**: Base template with common structure
- **index.html**: Homepage with features showcase
- **login.html**: Login form with client-side validation
- **signup.html**: Signup form with validation
- **dashboard.html**: Protected dashboard page

### static/
- **css/style.css**: Complete styling including responsive design
- **js/script.js**: Utility functions and validation

## Important Notes

1. Change the `SECRET_KEY` in `app.py` before deploying to production
2. Create a `.env` file for sensitive configuration (recommended)
3. The database is automatically created on first run
4. All form data is validated on both client and server side

## Support

For issues or questions, please create an issue on the GitHub repository.

## License

This project is open source and available under the MIT License.

## Author

Ron Shrestha - 2024
