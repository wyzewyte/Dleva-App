# 🔐 Authentication & Password Reset Implementation Analysis

## Executive Summary

Your codebase has **solid OTP infrastructure for riders** (fully implemented with Twilio SMS), **buyer frontend UI for password reset** (but missing backend), and **no password reset for sellers**. Django's authentication system is in place for all modules.

---

## 📍 Current Implementation Status

### ✅ FULLY IMPLEMENTED: Rider Phone Verification with OTP

**Location**: `dleva/rider/auth_views.py`, `dleva/rider/models.py`, `dleva/utils/twilio_service.py`

| Component | Status | Details |
|-----------|--------|---------|
| **OTP Generation** | ✅ Complete | 6-digit codes, 10-minute expiry |
| **SMS Service** | ✅ Complete | Twilio integration with console fallback |
| **OTP Storage** | ✅ Complete | RiderOTP model with attempt tracking |
| **Phone Verification Flow** | ✅ Complete | Registration → OTP → Verification |
| **Registration Integration** | ✅ Complete | Auto-sends OTP on registration |

**Backend Endpoints** (All Working):
```
POST /api/rider/register/                    - Auto-sends registration OTP
POST /api/rider/login/                       - Login with username/password
POST /api/rider/request-phone-otp/           - Authenticated: Request new OTP
POST /api/rider/verify-phone-otp/            - AllowAny: Verify OTP code
POST /api/rider/resend-phone-otp/            - Authenticated: Resend OTP
POST /api/rider/resend-registration-otp/     - AllowAny: Resend during registration
```

**Code Example** (Rider Registration):
```python
# File: dleva/rider/auth_views.py (lines 28-65)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_rider(request):
    # Creates rider, generates OTP, sends via SMS
    otp_code = generate_otp()
    RiderOTP.objects.create(
        rider=rider_profile,
        phone_number=phone,
        otp_code=otp_code,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    TwilioService.send_otp_sms(phone_number, otp_code, purpose='registration')
```

---

### ⚠️ PARTIALLY IMPLEMENTED: Buyer Password Change (Authenticated Only)

**Location**: `dleva/buyer/views.py` (lines 113-137)

| Feature | Status | Details |
|---------|--------|---------|
| **Change Password (Authenticated)** | ✅ Works | Requires old password |
| **Forgot Password** | ❌ Missing | Frontend only, no backend |
| **OTP Verification** | ❌ Missing | No OTP model for buyer |
| **SMS Integration** | ❌ Missing | Not connected to Twilio |

**Current Endpoint** (Authenticated Only):
```python
# File: dleva/buyer/views.py
POST /api/buyer/change-password/
Requires: old_password, new_password
```

**Frontend Pages That Are Broken**:
```
Frontend: src/modules/buyer/pages/auth/ForgotPasswordModern.jsx
  → Calls POST /api/buyer/forgot-password/ (ENDPOINT DOESN'T EXIST)

Frontend: src/modules/buyer/pages/auth/VerifyCodeModern.jsx
  → Calls POST /api/buyer/verify-reset-code/ (ENDPOINT DOESN'T EXIST)

Frontend: src/modules/buyer/pages/auth/ResetPasswordModern.jsx
  → Calls POST /api/buyer/reset-password/ (ENDPOINT DOESN'T EXIST)
```

---

### 🚫 NOT IMPLEMENTED: Seller Password Reset

**Status**: Links only, no implementation

| Item | Status |
|------|--------|
| **Frontend Pages** | ❌ No component at `/seller/forgot-password` |
| **Backend Endpoints** | ❌ None |
| **OTP Integration** | ❌ None |
| **SMS Service** | ❌ Not connected |

**Frontend Link Found**: `src/modules/seller/pages/auth/Login.jsx` (lines 105-106)
```jsx
<Link to="/seller/forgot-password">Forgot Password?</Link>
```

---

## 🔧 Services & Libraries Used

### 1. Twilio SMS Service ✅ (Ready to Use)

**File**: `dleva/utils/twilio_service.py`

**Configuration**:
```python
ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default=None)
AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default=None)
SENDER_PHONE = config('TWILIO_SENDER_PHONE', default=None)
```

**Environment Variables Required**:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SENDER_PHONE=+234905123456
```

**Methods Available**:
```python
TwilioService.send_otp_sms(phone_number, otp_code, purpose)
TwilioService.send_notification_sms(phone_number, message_text)
TwilioService.send_rider_otp_sms(phone_number, otp_code)
```

**Phone Number Auto-Formatting**:
```
0905XXXXXXXX    → +234905XXXXXXXX (Nigerian)
905XXXXXXXX     → +234905XXXXXXXX (Nigerian without 0)
+234905XXXXXXXX → stays as is
```

**Fallback Mode**: If Twilio not configured, OTP prints to console for testing

**Requirements**: `twilio==9.0.0` (already in requirements.txt)

---

### 2. JWT Authentication ✅ (In Use)

**Library**: `rest_framework_simplejwt`

**Usage Pattern**:
```python
from rest_framework_simplejwt.tokens import RefreshToken

# In login endpoint
refresh = RefreshToken.for_user(user)
return Response({
    'refresh': str(refresh),
    'access': str(refresh.access_token),
})
```

**Token Endpoints**:
- `/buyer/token/refresh/`
- `/seller/token/refresh/`
- `/rider/token/refresh/`

---

### 3. Django Built-in Password Management

**Hashing**: Django's `User.set_password()` (uses PBKDF2 by default)

**Verification**: Django's `User.check_password()`

**Already Used In**:
- Buyer login (line 91 in buyer/auth_views.py)
- Buyer change password (line 128 in buyer/views.py)
- Rider login (line 82 in rider/auth_views.py)

---

## 📊 Current Authentication Flow by Role

### Rider Flow
```
1. Register (phone number)
   ↓
2. Receive OTP via SMS
   ↓
3. Verify OTP → phone_verified = True
   ↓
4. Login (username + password)
   ↓
5. Get JWT tokens
   ↓
6. Can change password (authenticated)
   ↓
7. ❌ No password reset (forgot password) implemented
```

### Buyer Flow
```
1. Register (email + password)
   ↓
2. Login (username + password)
   ↓
3. Get JWT tokens
   ↓
4. Can change password (requires old password)
   ↓
5. ❌ Password reset exists frontend only!
      - ForgotPassword page → user enters phone
      - VerifyCode page → should verify OTP
      - ResetPassword page → should set new password
   BUT backend endpoints missing!
```

### Seller Flow
```
1. Register (email + password)
   ↓
2. Login (username + password)
   ↓
3. Get JWT tokens
   ↓
4. Create restaurant profile
   ↓
5. ❌ No password reset at all
```

---

## 🗄️ Database Models

### RiderOTP Model ✅
```python
# File: dleva/rider/models.py (lines 354-368)
class RiderOTP(models.Model):
    rider = ForeignKey(RiderProfile, on_delete=CASCADE)
    phone_number = CharField(max_length=20)
    otp_code = CharField(max_length=6)
    is_verified = BooleanField(default=False)
    attempts = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
    expires_at = DateTimeField()
    
    # 10-minute expiry, 3 attempt limit, tracks verification state
```

### BuyerOTP Model ❌
**Does NOT exist** - needs to be created for buyer password reset

### SellerOTP Model ❌
**Does NOT exist** - needs to be created for seller password reset

### User Model (Django Built-in)
```python
# File: Django auth
class User:
    username
    password (hashed with PBKDF2)
    email
    # Used by: BuyerProfile, RiderProfile, SellerProfile
```

---

## 📋 What Can Be Reused vs What Must Be Built

### ✅ REUSABLE COMPONENTS

1. **TwilioService Class**
   - Ready to use for buyer/seller OTP
   - Auto-formats phone numbers
   - Handles all SMS logic
   - **How to use**: `TwilioService.send_otp_sms(phone, code, purpose)`

2. **OTP Generation Logic**
   ```python
   # File: dleva/rider/auth_views.py (line 339)
   def generate_otp():
       return ''.join(random.choices(string.digits, k=6))
   ```

3. **OTP Validation Pattern**
   - RiderOTP model can be adapted as template
   - Includes: expiry checking, attempt limiting, verification status
   - **Pattern**: Create BuyerOTP and SellerOTP models using same structure

4. **Frontend Form Components**
   - BuyerAuthPanel, BuyerTextInput, BuyerPrimaryButton
   - Already styled and working
   - Can adapt for seller module too
   - **Location**: `src/modules/buyer/components/ui/BuyerPrimitives`

5. **JWT Token System**
   - RefreshToken.for_user() works for all user types
   - Already integrated for buyers, riders, sellers
   - **Ready to use** for any auth flow

6. **Phone Number Normalization**
   ```python
   # File: dleva/rider/auth_views.py (line 20)
   def normalize_phone_number(value):
       return str(value).strip().replace(' ', '')
   ```

---

### 🔨 MUST BUILD

1. **BuyerOTP Model** (NEW)
   ```python
   # Similar to RiderOTP but linked to BuyerProfile
   class BuyerOTP(models.Model):
       buyer = ForeignKey(BuyerProfile, on_delete=CASCADE)
       phone_number = CharField(max_length=20)
       otp_code = CharField(max_length=6)
       is_verified = BooleanField(default=False)
       purpose = CharField(max_length=20)  # 'password_reset', 'phone_verify', etc.
       attempts = IntegerField(default=0)
       created_at = DateTimeField(auto_now_add=True)
       expires_at = DateTimeField()
   ```

2. **Buyer Password Reset Endpoints** (3 NEW)
   ```python
   POST /buyer/forgot-password/
   POST /buyer/verify-reset-code/
   POST /buyer/reset-password/
   ```

3. **SellerOTP Model** (NEW)
   ```python
   class SellerOTP(models.Model):
       seller = ForeignKey(SellerProfile, on_delete=CASCADE)
       # ... same fields as BuyerOTP
   ```

4. **Seller Password Reset Endpoints** (3 NEW)
   ```python
   POST /seller/forgot-password/
   POST /seller/verify-reset-code/
   POST /seller/reset-password/
   ```

5. **Seller Frontend Components** (3 NEW)
   - ForgotPassword.jsx
   - VerifyCode.jsx (for seller)
   - ResetPassword.jsx (for seller)

6. **Rider Password Reset** (Optional for future)
   - Could reuse phone verification system
   - Or create separate endpoints

---

## 📂 File Structure Reference

### Backend Files to Know
```
dleva/
├── utils/
│   ├── twilio_service.py          ✅ SMS service (READY)
│   ├── __init__.py
│   └── paystack_service.py
├── buyer/
│   ├── auth_views.py              ✅ Login/Register
│   ├── views.py                   ✅ Has change_password (line 113)
│   ├── models.py                  ⚠️  No OTP model
│   ├── urls.py                    ❌ No forgot-password endpoints
│   └── serializers.py
├── rider/
│   ├── auth_views.py              ✅ Complete OTP flow (lines 1-350)
│   ├── models.py                  ✅ RiderOTP model (line 354)
│   └── urls.py                    ✅ All endpoints configured
├── seller/
│   ├── auth_views.py              ⚠️  Basic login only
│   ├── views.py
│   ├── models.py                  ❌ No OTP model
│   └── urls.py
└── core/
    ├── settings.py                ✅ Has TWILIO settings
    ├── push_notifications.py      ✅ SMS integration
    └── urls.py
```

### Frontend Files
```
dleva-frontend/src/
├── modules/
│   ├── buyer/
│   │   └── pages/auth/
│   │       ├── ForgotPasswordModern.jsx       ❌ No working backend
│   │       ├── VerifyCodeModern.jsx           ❌ No working backend
│   │       ├── ResetPasswordModern.jsx        ❌ No working backend
│   │       ├── BuyerLoginModern.jsx           ✅ Works
│   │       └── SignupModern.jsx               ✅ Works
│   ├── rider/
│   │   └── pages/
│   │       ├── Registration.jsx               ✅ Uses OTP
│   │       └── FAQ.jsx                        ℹ️  References forgot-password
│   └── seller/
│       └── pages/auth/
│           ├── Login.jsx                      ⚠️  Links to forgot-password
│           └── Register.jsx                   ✅ Works
├── constants/
│   └── apiConfig.js                           ⚠️  Missing password reset endpoints
└── services/
    ├── buyerAuth.js                           ⚠️  No forgot-password methods
    ├── buyerProfile.js                        ✅ Has changePassword()
    └── riderAuth.js
```

---

## 🔄 Rider Phone Verification Code Flow (Reference Implementation)

This is the **working model** you can adapt for buyer/seller password reset:

**Step 1: Generate OTP (auth_views.py)**
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def register_rider(request):
    # ... create user & rider profile ...
    
    otp_code = generate_otp()  # 6-digit code
    RiderOTP.objects.create(
        rider=rider_profile,
        phone_number=rider_profile.phone_number,
        otp_code=otp_code,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    # Send via SMS
    TwilioService.send_otp_sms(
        phone_number=rider_profile.phone_number,
        otp_code=otp_code,
        purpose='registration'
    )
    
    return Response({
        'message': 'OTP sent to phone',
        'otp_sent_to': phone_number,
        'expires_in_minutes': 10
    }, status=status.HTTP_201_CREATED)
```

**Step 2: Verify OTP (auth_views.py)**
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    phone_number = request.data.get('phone_number')
    otp_code = request.data.get('otp_code')
    
    # Get OTP record
    otp = RiderOTP.objects.filter(
        phone_number=phone_number,
        otp_code=otp_code,
        is_verified=False
    ).latest('created_at')
    
    # Check expiry
    if otp.expires_at < timezone.now():
        return Response({'message': 'OTP expired'}, status=400)
    
    # Check attempts
    if otp.attempts >= 3:
        return Response({'message': 'Max attempts exceeded'}, status=400)
    
    # Mark as verified
    otp.is_verified = True
    otp.save()
    
    # Update rider
    rider = otp.rider
    rider.phone_verified = True
    rider.save()
    
    return Response({'message': 'Phone verified'}, status=200)
```

---

## 📞 SMS Flow Example (Twilio Service)

```python
# File: dleva/utils/twilio_service.py (line 40)

@classmethod
def send_otp_sms(cls, phone_number, otp_code, purpose='verification'):
    """Send OTP via SMS"""
    
    # Check if configured
    if not cls.is_configured():
        logger.warning("Twilio not configured, printing to console")
        cls._print_otp_console(phone_number, otp_code, purpose)
        return {'success': False, 'message': 'SMS service not available'}
    
    try:
        client = cls._get_client()
        phone = cls._format_phone_number(phone_number)
        
        message_text = f"Your {purpose} code is: {otp_code}. Valid for 10 minutes."
        
        message = client.messages.create(
            body=message_text,
            from_=cls.SENDER_PHONE,
            to=phone
        )
        
        logger.info(f"✅ OTP sent to {phone}")
        return {
            'success': True,
            'message_sid': message.sid,
            'status': message.status
        }
    
    except Exception as e:
        logger.error(f"❌ Failed to send OTP: {str(e)}")
        return {'success': False, 'error': str(e)}
```

---

## ⚠️ Security Considerations

### Current Implementation ✅
- OTP expires after 10 minutes
- Attempt limiting (max 3 attempts before blocking)
- OTP codes are 6 digits (1 in 1,000,000 combinations)
- Passwords hashed with Django's PBKDF2 (industry standard)
- JWT tokens for stateless authentication

### Recommendations ❓
- Add rate limiting to prevent brute force (e.g., max 5 password reset requests per phone per hour)
- Add phone number verification to prevent spam
- Consider adding CAPTCHA to forgot password form
- Log all authentication attempts
- Add account lockout after X failed login attempts

---

## 🚀 Implementation Roadmap

### Phase 1: Fix Buyer Password Reset (Highest Priority)
1. ✅ Create `BuyerOTP` model (database)
2. ✅ Create 3 backend endpoints
3. ✅ Connect to existing Twilio service
4. ✅ Test end-to-end flow
5. ✅ Frontend already exists (just needs backend)

### Phase 2: Implement Seller Password Reset
1. Create `SellerOTP` model
2. Create 3 backend endpoints
3. Create frontend components (reuse buyer forms)
4. Test end-to-end

### Phase 3: Optional - Rider Password Reset
1. Could adapt existing phone verification
2. Create separate endpoints if preferred
3. Or could use Twilio to send password reset code

---

## 📝 Quick Command Reference

### Check Current Configuration
```bash
# Check Twilio environment variables
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_SENDER_PHONE

# Test in Django shell
python manage.py shell
>>> from utils.twilio_service import TwilioService
>>> TwilioService.is_configured()
```

### Database Queries
```python
# Check for existing OTPs
from rider.models import RiderOTP
RiderOTP.objects.filter(is_verified=False).count()

# View OTP history for testing
RiderOTP.objects.filter(rider__id=1).order_by('-created_at')[:5]
```

---

## 📖 API Documentation Template

**For Frontend Developers:**

### Endpoint: POST `/buyer/forgot-password/` (TO BE IMPLEMENTED)
```
Purpose: Send OTP to phone for password reset
Permission: AllowAny

Request:
{
    "phone": "+2340xxxxxxxxx"
}

Response (200):
{
    "message": "OTP sent to phone",
    "otp_sent_to": "+2340xxxxxxxxx",
    "expires_in_minutes": 10
}

Response (400):
{
    "error": "Phone number not found"
}
```

### Endpoint: POST `/buyer/verify-reset-code/` (TO BE IMPLEMENTED)
```
Purpose: Verify OTP code
Permission: AllowAny

Request:
{
    "phone": "+2340xxxxxxxxx",
    "code": "123456"
}

Response (200):
{
    "message": "Code verified"
}

Response (400):
{
    "error": "Invalid or expired code"
}
```

### Endpoint: POST `/buyer/reset-password/` (TO BE IMPLEMENTED)
```
Purpose: Reset password after OTP verification
Permission: AllowAny

Request:
{
    "phone": "+2340xxxxxxxxx",
    "code": "123456",
    "password": "newPassword123"
}

Response (200):
{
    "message": "Password reset successful"
}

Response (400):
{
    "error": "Code expired or invalid"
}
```

---

## 📞 Support Files Reference

- **Twilio Setup Guide**: `/memories/repo/twilio_sms_integration_setup.txt`
- **Firebase Push**: `/memories/repo/firebase_push_notifications_production.md`
- **Rider Documentation**: `documentations/PHASE_2_IMPLEMENTATION.md`

---

## Summary Table

| Feature | Buyer | Rider | Seller |
|---------|-------|-------|--------|
| **OTP Generation** | ❌ Not implemented | ✅ Complete | ❌ Not implemented |
| **SMS Integration** | ❌ Not implemented | ✅ Complete | ❌ Not implemented |
| **Phone Verification** | ❌ Not in auth flow | ✅ During registration | ❌ Not implemented |
| **Forgot Password Endpoint** | ❌ Missing | ❌ Not applicable | ❌ Not implemented |
| **Verify Code Endpoint** | ❌ Missing | ❌ Not applicable | ❌ Not implemented |
| **Reset Password Endpoint** | ❌ Missing | ❌ Not applicable | ❌ Not implemented |
| **Change Password (Auth)** | ✅ Works | ❌ Not implemented | ❌ Not implemented |
| **Frontend Forms** | ✅ All 3 exist | ❌ Not needed (phone otp) | ⚠️ Link only |
| **Database Model** | ❌ No OTP model | ✅ RiderOTP exists | ❌ No OTP model |
| **JWT Auth** | ✅ Implemented | ✅ Implemented | ✅ Implemented |

---

Generated: 2024 | Dleva Food Delivery Platform
