# Coupon Management System - Frontend

A modern React frontend for managing promotional coupon codes with separate customer and admin interfaces.

## ✨ Features

### Customer Portal
- **Available Coupons**: Browse eligible coupons with category information
- **Shopping Cart**: Add products, apply coupons, real-time discount calculation
- **Coupon Recommendations**: Smart suggestions based on cart
- **Usage History**: Track redemptions, savings, and order cancellation
- **Real-time Validation**: Instant coupon validation with detailed feedback

### Admin Portal
- **Dashboard**: Key metrics, analytics, and performance indicators
- **Coupon Management**: Create, edit, view, and delete coupons
- **Advanced Filters**: Search and filter by status, type, dates
- **Analytics**: Revenue impact, top coupons, usage reports
- **Comprehensive View**: All coupon fields with targeting rules

## 🚀 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Context API** for state management

## 📦 Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API URL:**
Create `.env.local`:
```env
VITE_API_URL=http://localhost:3000
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔐 Authentication

### Register
Use the registration form on the login page to create new accounts.

### Login
After seeding the backend, use:
- **Customer**: `customer1@example.com` / `password123`
- **Admin**: `admin1@example.com` / `admin123`

## 🎯 Key Features

### Customer Features
1. **Coupon Discovery**
   - Visual coupon cards with discount badges
   - Category information (applicable/excluded)
   - Copy-to-clipboard functionality
   - Usage limits and expiry dates
   - User-specific usage tracking

2. **Shopping & Checkout**
   - Product catalog with categories
   - Cart management (add, remove, update)
   - Real-time coupon validation
   - Discount breakdown per item
   - Coupon recommendations
   - Order creation

3. **Usage Tracking**
   - Detailed order history
   - Total savings summary
   - Average discount percentage
   - Order cancellation

### Admin Features
1. **Coupon Management**
   - Create coupons with all options
   - Edit existing coupons
   - View comprehensive coupon details
   - Search and filter
   - Toggle active status
   - Delete coupons

2. **Analytics Dashboard**
   - Total and active coupons
   - Usage statistics
   - Revenue impact
   - Top performing coupons
   - Average discount per use
   - Active coupon rate

3. **Reports**
   - Coupon status distribution
   - Usage metrics
   - Revenue analytics

## 🎨 Design System

- **Responsive**: Mobile, tablet, and desktop
- **Modern UI**: Clean design with gradient accents
- **Animations**: Smooth transitions and interactions
- **Color-coded**: Status indicators with meaningful colors
- **Accessible**: Clear hierarchy and readable typography

## 🔌 Backend Integration

Fully integrated with the NestJS backend API.

### API Endpoints Used
- **Auth**: `/auth/login`, `/auth/register`
- **Customer**: 
  - `/coupons/available`
  - `/coupons/:code/validate`
  - `/coupons/:code/apply`
  - `/coupons/my-usage`
  - `/coupons/recommend`
- **Orders**: 
  - `POST /orders`
  - `DELETE /orders/:id`
- **Admin**: 
  - `/admin/coupons/*`
  - `/admin/reports/*`

### Data Flow
- All data fetched from backend APIs
- Real-time validation using backend logic
- Order creation with coupon application
- Analytics from backend database

## 🎯 Discount Types

1. **Percentage**: X% off with optional max cap
2. **Fixed Amount**: Flat ₹X off
3. **Free Delivery**: Waives delivery charges

## 🚀 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 📝 License

MIT License

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
