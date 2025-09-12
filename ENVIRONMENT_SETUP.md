# Environment Setup Guide - Eagles Events MERN Stack

This guide will help you set up the environment variables for both the backend and frontend of the Eagles Events application.

## Quick Setup

### 1. Backend Environment Setup

1. **Copy the environment template:**
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edit the `.env` file with your actual values:**
   ```bash
   # Open the file in your preferred editor
   code .env  # or nano .env, vim .env, etc.
   ```

3. **Required Environment Variables for Backend:**

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `NODE_ENV` | Application environment | `development` or `production` |
   | `PORT` | Server port | `5000` |
   | `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/eagles-events` |
   | `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-here` |
   | `JWT_EXPIRE` | JWT token expiration | `7d` |
   | `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
   | `SMTP_PORT` | Email SMTP port | `587` |
   | `SMTP_USER` | Email username | `your-email@gmail.com` |
   | `SMTP_PASS` | Email password/app password | `your-app-password` |
   | `EMAIL_FROM` | Default sender email | `Eagles Events <noreply@eaglesevents.co.za>` |

### 2. Frontend Environment Setup

1. **Copy the environment template:**
   ```bash
   cd frontend
   cp env.example .env
   ```

2. **Edit the `.env` file with your actual values:**
   ```bash
   # Open the file in your preferred editor
   code .env  # or nano .env, vim .env, etc.
   ```

3. **Required Environment Variables for Frontend:**

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000` |
   | `REACT_APP_NODE_ENV` | Application environment | `development` or `production` |
   | `REACT_APP_COMPANY_NAME` | Company name | `Eagles Events` |
   | `REACT_APP_COMPANY_EMAIL` | Company email | `info@eaglesevents.co.za` |
   | `REACT_APP_COMPANY_PHONE` | Company phone | `+27-XX-XXX-XXXX` |

## Detailed Configuration

### Database Configuration

#### MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get your connection string and update `MONGO_URI`

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eagles-events?retryWrites=true&w=majority
```

### Email Configuration

#### Gmail SMTP Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the app password in `SMTP_PASS`

#### Alternative Email Services
- **SendGrid**: Use `smtp.sendgrid.net` as host
- **Mailgun**: Use `smtp.mailgun.org` as host
- **Outlook**: Use `smtp-mail.outlook.com` as host

### JWT Configuration

Generate a secure JWT secret:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

### CORS Configuration

For production, update `ALLOWED_ORIGINS` to include your domain:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, unique passwords and secrets**
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**
5. **Limit database access by IP when possible**

## Environment-Specific Configurations

### Development
- Use local MongoDB or MongoDB Atlas
- Enable debug logging
- Use development API URLs

### Production
- Use production MongoDB Atlas
- Disable debug logging
- Use production API URLs
- Enable security features

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `MONGO_URI` format
   - Verify IP whitelist in MongoDB Atlas
   - Check network connectivity

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check if 2FA is enabled for Gmail
   - Verify app password is correct

3. **CORS Errors**
   - Check `ALLOWED_ORIGINS` configuration
   - Ensure frontend URL is included

4. **JWT Token Issues**
   - Verify `JWT_SECRET` is set
   - Check token expiration settings

### Testing Environment Variables

#### Backend
```bash
cd backend
node -e "require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set' : 'Not set');"
```

#### Frontend
```bash
cd frontend
node -e "console.log('API URL:', process.env.REACT_APP_API_URL || 'Not set');"
```

## File Structure

```
Eagles-Events-MERN-STACK/
├── backend/
│   ├── .env                 # Backend environment variables (create from env.example)
│   ├── env.example         # Backend environment template
│   └── ...
├── frontend/
│   ├── .env                # Frontend environment variables (create from env.example)
│   ├── env.example        # Frontend environment template
│   └── ...
└── .gitignore             # Excludes .env files from version control
```

## Next Steps

1. Create your `.env` files from the templates
2. Configure your database connection
3. Set up email service
4. Generate secure JWT secrets
5. Test the application

For any issues, check the application logs and verify all environment variables are correctly set.
