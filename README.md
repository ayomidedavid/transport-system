# UNITRANSIT - Smart Logistics for Campus Transit

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

UNITRANSIT is a premium, full-stack logistics and transport management platform designed to streamline student travel between campuses and cities. It provides a seamless interface for students to book trips and a professional dashboard for logistics vendors to manage their fleet and revenue.

---

## Key Features

### Student Portal
- **Real-time Trip Discovery**: Browse available trips with detailed route information and pricing.
- **Instant Booking**: Secure seat reservations with immediate login.
- **Booking History**: Track past and upcoming trips with digital boarding passes.
- **Secure Payments**: Mock Paystack integration for local booking verification.

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
- **Styling**: Vanilla CSS with CSS Variables (Minimalist Grayscale Theme)
- **State Management**: React Context API
- **Icons**: Lucide React
- **Animations**: CSS3 Transitions & GSAP

### Backend & Database
- **Framework**: Python Flask (running on port `5129` with `/api` prefix)
- **Database**: SQLite (`backend/unitransit.db`)
- **Authentication**: JSON Web Token (JWT)
- **Payments**: Paystack API (Mocked locally for verification)

---

## Installation & Setup

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.8+) & pip

### 1. Clone the Repository
```bash
git clone https://github.com/ayomidedavid/transport-system.git
cd transport-system
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd ../backend
pip install -r requirements.txt
```

### 3. Run the Application

**Run Backend (Flask):**
```bash
# In the backend directory
python app.py
```
*(Starts Flask on http://localhost:5129)*

**Run Frontend (Vite):**
```bash
# In the frontend directory
npm run dev
```
*(Starts Vite dev server on http://localhost:5173)*

---

## Project Structure
```text
├── backend/                  # Flask Backend & SQLite DB
│   ├── app.py                # Main server entrypoint & seed script
│   ├── models.py             # SQLAlchemy models
│   ├── routes.py             # REST API endpoints & JWT logic
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/             # Admin Dashboard Pages
│   │   │   ├── dashboard/         # Student Portal Pages
│   │   │   └── vendor-dashboard/  # Logistics Vendor Portal
│   │   │   └── _context/          # State Management
│   │   ├── lib/                   # API clients & PDF utilities
│   │   └── App.tsx                # Main Router
│   └── public/                    # Static Assets
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

**Built by the UNITRANSIT Team**
