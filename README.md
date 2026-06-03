# UNIRIDE - Smart Logistics for Campus Transit

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

UNIRIDE (formerly Unitransit) is a premium, full-stack logistics and transport management platform designed to streamline student travel between campuses and cities. It provides a seamless interface for students to book trips and a professional dashboard for logistics vendors to manage their fleet and revenue.

---

## Key Features

### Student Portal
- **Real-time Trip Discovery**: Browse available trips with detailed route information and pricing.
- **Instant Booking**: Secure seat reservations with automated email and SMS notifications.
- **Booking History**: Track past and upcoming trips with digital boarding passes.
- **Secure Payments**: Integrated with Paystack for safe and reliable transactions.

### Logistics Vendor Dashboard
- **Premium Analytics**: Track revenue growth, trip volume, and seat occupancy via interactive charts.
- **Trip Management**: Easily schedule new routes, manage vehicle types (Sienna, Hiace, Coaster), and update seat availability.
- **Student Bookings**: Manage reservation requests with a single click (Approve/Reject/Cancel).
- **Company Profile**: Manage business details and verification status.

### Admin Portal
- **Vendor Verification**: Review and approve new logistics companies to maintain platform quality.
- **Global Analytics**: Monitor total system revenue, user growth, and active trips.
- **System Logs**: Track transactions and platform activity in real-time.

---

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS with CSS Variables (Premium Light Theme)
- **State Management**: React Context API
- **Icons**: Lucide React
- **Animations**: CSS3 Transitions & GSAP

### Backend & Database
- **Auth & DB**: Supabase (PostgreSQL)
- **Server**: Node.js & Express (Email notifications, Admin actions, Paystack integration)
- **Mailing**: Brevo (Sendinblue) API for OTP and transactional emails
- **Payments**: Paystack API

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/Mazi631/Unitransit.git
cd Unitransit
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration
Create a .env file in the root directory and the server directory with the following variables:

**Root .env**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

**Server .env**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_SECRET_KEY=your_paystack_key
BREVO_API_KEY=your_brevo_key
PORT=5000
```

### 4. Run the Application
```bash
# Run Frontend (Vite)
npm run dev

# Run Backend (Express) - In a separate terminal
cd server
node index.js
```

---

## Project Structure
```text
├── src/
│   ├── app/
│   │   ├── admin/             # Admin Dashboard Pages
│   │   ├── dashboard/         # Student Portal Pages
│   │   ├── vendor-dashboard/  # Logistics Vendor Portal
│   │   └── _context/          # State Management
│   ├── lib/                   # Supabase Client & Utils
│   └── App.tsx                # Main Router
├── server/                    # Express Backend
├── supabase/                  # SQL Schema & Migrations
└── public/                    # Static Assets
```

---

## Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

---

## License
Distributed under the MIT License. See LICENSE for more information.

---

**Built by the UNIRIDE Team**
