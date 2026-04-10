# 🚀 Production Deployment Guide - Pxxl Space

## Pre-Deployment Checklist

### ✅ 1. Environment Variables & Secrets

**DO NOT COMMIT .env files to GitHub!**

- [x] Created `.env.example` files (not committed)
- [x] Created `.gitignore` to exclude `.env` files
- [ ] Generate a new `SECRET_KEY` for production:
  ```bash
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```

### ✅ 2. Django Settings for Production

Update your Pxxl Space environment variables:

```
SECRET_KEY=<your-generated-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
DB_HOST=<pxxl-database-host>
DB_NAME=<pxxl-database-name>
DB_USER=<pxxl-database-user>
DB_PASSWORD=<pxxl-database-password>
DB_PORT=5432
PAYSTACK_PUBLIC_KEY=sk_live_xxxxx  # Use LIVE keys!
PAYSTACK_SECRET_KEY=pk_live_xxxxx
PAYSTACK_CALLBACK_URL=https://yourdomain.com/payment/callback
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_SENDER_PHONE=<phone>
```

### ✅ 3. CORS Configuration

Update `core/settings.py` for production:

```python
# Development
CORS_ALLOW_ALL_ORIGINS = True

# Should become:
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://app.yourdomain.com",
]
```

### ✅ 4. Static & Media Files

On Pxxl Space, configure storage:

```bash
# Azure Blob Storage or AWS S3 (recommended)
# Update settings.py to use cloud storage
```

Or use Pxxl Space's built-in `/public` directory:

```python
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### ✅ 5. Database Migrations

```bash
# Before pushing
python manage.py makemigrations
python manage.py migrate --noinput
```

### ✅ 6. Frontend Build

```bash
# In dleva-frontend/
npm run build

# Update .env:
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_BASE_URL=https://api.yourdomain.com/api
```

### ✅ 7. Procfile for Pxxl Space

Create `Procfile` in root:

```
web: daphne -b 0.0.0.0 -p $PORT core.asgi:application
release: python manage.py migrate
```

Or for standard WSGI:

```
web: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
```

### ✅ 8. Runtime Configuration

Create `runtime.txt`:

```
python-3.11.8
```

### ✅ 9. Key Dependencies Check

```bash
# Backend
pip freeze > requirements.txt

# Add these for production:
# - gunicorn (if not using Daphne)
# - whitenoise (for static files)
```

Update `requirements.txt`:

```
gunicorn==21.2.0
whitenoise==6.6.0
django-storages==1.14.2  # For cloud storage
boto3==1.26.0  # For AWS S3
```

### ✅ 10. Security Headers

Add to `core/settings.py`:

```python
# Production Security Settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_SECURITY_POLICY = {
        "default-src": ("'self'",),
    }
```

### ✅ 11. Logging Configuration

Add to `core/settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

---

## 📋 Deployment Steps

### Step 1: Prepare Code for GitHub

```bash
# Make sure .env is in .gitignore
git status  # Verify .env is NOT listed
git add .
git commit -m "Prepare for production deployment"
```

### Step 2: Create GitHub Actions (Optional but Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Pxxl Space
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Pxxl Space
        env:
          PXXL_API_KEY: ${{ secrets.PXXL_API_KEY }}
        run: |
          # Pxxl Space deployment commands
```

### Step 3: Connect GitHub to Pxxl Space

1. Log in to Pxxl Space
2. Create new project → Select "GitHub"
3. Authorize & select your repo
4. Set environment variables in dashboard
5. Deploy!

### Step 4: Verify Deployment

```bash
# Check health
curl https://yourdomain.com/api

# View logs
pxxl logs  # (if supported)
```

---

## ⚠️ Important Notes

- **Never commit .env files** - Always use environment variable dashboard
- **Use LIVE Paystack keys** - Switch from test to live keys
- **Database backup** - Set up automated backups
- **SSL Certificate** - Pxxl Space should provide free SSL via Let's Encrypt
- **Domain setup** - Configure DNS records to point to Pxxl Space
- **Monitoring** - Set up error tracking (Sentry, etc.)

---

## 🔑 Production Commands

```bash
# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate --noinput
```

---

## 📞 Support

- Pxxl Space Docs: https://pxxl.space/docs
- Django Deployment: https://docs.djangoproject.com/en/5.2/howto/deployment/
- Vite Build: https://vitejs.dev/guide/build.html
