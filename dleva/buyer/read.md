# 🍽️ DLEVA Backend

**DLEVA** is a modern food delivery platform that connects **buyers, restaurants, and riders** in one trusted community.  
This repository contains the **backend system**, built with **Django + Django REST Framework** and **PostgreSQL**, handling all API endpoints, authentication, and order logic.

---

## 🚀 Features

### 👩‍💻 Buyer Module
- JWT Authentication (Register / Login)
- Buyer Profile (with address, preferences, coordinates)
- Restaurant listing and 20km location filter
- Menu system with image uploads
- Cart system (multi-restaurant support)
- Checkout and Order creation
- Simulated payments (Paystack-ready structure)
- Order tracking (pending → delivered)
- Reorder and feedback system

### 🏍️ Rider Module
- Rider authentication (in development)
- Order pickup and delivery management
- Real-time order status updates (polling, future channels)
- Delivery fee management (fixed, within 20km)

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (SimpleJWT) |
| Real-time | Polling (Django Channels planned) |
| File Storage | Django Media Uploads |
| Payments | Paystack Simulation (live-ready) |

---

## ⚙️ Installation Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<wyzewyte>/dleva-backend.git
cd dleva-backend


### API ENDPOINTS FOR BUYER

| Feature                    | Method  | Endpoint                                    |
| -------------------------- | ------- | ------------------------------------------- |
| Register Buyer             | POST    | `/api/buyer/register/`                      |
| Login Buyer                | POST    | `/api/buyer/login/`                         |
| Buyer Profile              | GET/PUT | `/api/buyer/profile/`                       |
| Restaurants (20km filter)  | GET     | `/api/buyer/restaurants/`                   |
| Menu Items                 | GET     | `/api/buyer/menu/?restaurant=<id>`          |
| Add to Cart                | POST    | `/api/buyer/cart/add/`                      |
| View Carts                 | GET     | `/api/buyer/cart/`                          |
| Checkout                   | POST    | `/api/buyer/checkout/<cart_id>/`            |
| Payments (simulate)        | POST    | `/api/buyer/payment/initialize/<order_id>/` |
| Verify Payment             | POST    | `/api/buyer/payment/verify/<ref>/`          |
| Orders (Ongoing/Completed) | GET     | `/api/buyer/orders/`                        |
| Order Status               | GET     | `/api/buyer/order-status/<id>/`             |
| Rate Order                 | POST    | `/api/buyer/rate/`                          |
| Reorder                    | POST    | `/api/buyer/reorder/<order_id>/`            |