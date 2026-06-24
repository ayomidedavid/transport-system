import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email_confirmed = db.Column(db.Boolean, default=True) # Immediate confirmation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade="all, delete-orphan")
    bookings = db.relationship('Booking', backref='student', cascade="all, delete-orphan")
    transactions = db.relationship('Transaction', backref='student')
    notifications = db.relationship('Notification', backref='recipient')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'emailConfirmed': self.email_confirmed,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50))
    matric = db.Column(db.String(50))
    department = db.Column(db.String(100))
    student_id = db.Column(db.String(50))
    role = db.Column(db.String(50), default='student') # 'student', 'vendor', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'phone': self.phone,
            'matric': self.matric,
            'department': self.department,
            'studentId': self.student_id,
            'role': self.role,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class Vendor(db.Model):
    __tablename__ = 'vendors'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    registration_number = db.Column(db.String(100))
    contact_person = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    address = db.Column(db.String(500))
    verification_status = db.Column(db.String(50), default='pending') # 'pending', 'approved', 'rejected'
    rejection_reason = db.Column(db.String(500))
    total_trips = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    trips = db.relationship('Trip', backref='vendor', cascade="all, delete-orphan")
    bookings = db.relationship('Booking', backref='vendor')
    transactions = db.relationship('Transaction', backref='vendor')

    def to_dict(self):
        return {
            'id': self.id,
            'ownerId': self.owner_id,
            'name': self.name,
            'registrationNumber': self.registration_number,
            'contactPerson': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'verificationStatus': self.verification_status,
            'rejectionReason': self.rejection_reason,
            'totalTrips': self.total_trips,
            'totalBookings': self.total_bookings,
            'totalRevenue': float(self.total_revenue),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class Trip(db.Model):
    __tablename__ = 'trips'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vendor_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=False)
    origin = db.Column(db.String(255), nullable=False)
    destination = db.Column(db.String(255), nullable=False)
    departure_date = db.Column(db.String(50), nullable=False) # stored as YYYY-MM-DD
    departure_time = db.Column(db.String(50), nullable=False)
    arrival_time = db.Column(db.String(50))
    vehicle_type = db.Column(db.String(100))
    total_seats = db.Column(db.Integer, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), default='active') # 'active', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='trip')

    def to_dict(self):
        vendor_data = None
        try:
            if self.vendor:
                vendor_data = {
                    'id': self.vendor.id,
                    'name': self.vendor.name,
                    'contactPerson': self.vendor.contact_person,
                    'email': self.vendor.email,
                    'phone': self.vendor.phone
                }
        except:
            pass

        return {
            'id': self.id,
            'vendorId': self.vendor_id,
            'origin': self.origin,
            'destination': self.destination,
            'departureDate': self.departure_date,
            'departureTime': self.departure_time,
            'arrivalTime': self.arrival_time,
            'vehicleType': self.vehicle_type,
            'totalSeats': self.total_seats,
            'availableSeats': self.available_seats,
            'price': float(self.price),
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'vendor': vendor_data
        }


class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    trip_id = db.Column(db.String(36), db.ForeignKey('trips.id'), nullable=True)
    vendor_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=True)
    route = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    destination = db.Column(db.String(255), nullable=False)
    vehicle_type = db.Column(db.String(100))
    status = db.Column(db.String(50), default='pending') # 'confirmed', 'pending', 'cancelled', 'completed'
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50))
    pickup = db.Column(db.String(255))
    seat = db.Column(db.String(50))
    ref = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.String(50))
    price_num = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    transactions = db.relationship('Transaction', backref='booking', cascade="all, delete-orphan")

    def to_dict(self):
        student_data = None
        try:
            if self.student and self.student.profile:
                student_data = {
                    'id': self.student.id,
                    'email': self.student.email,
                    'firstName': self.student.profile.first_name,
                    'lastName': self.student.profile.last_name,
                    'phone': self.student.profile.phone,
                    'matric': self.student.profile.matric,
                    'studentId': self.student.profile.student_id
                }
        except:
            pass
            
        return {
            'id': self.id,
            'studentId': self.student_id,
            'tripId': self.trip_id,
            'vendorId': self.vendor_id,
            'route': self.route,
            'company': self.company,
            'destination': self.destination,
            'vehicleType': self.vehicle_type,
            'status': self.status,
            'date': self.date,
            'time': self.time,
            'pickup': self.pickup,
            'seat': self.seat,
            'ref': self.ref,
            'amount': self.amount,
            'priceNum': float(self.price_num) if self.price_num else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'student': student_data
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = db.Column(db.String(36), db.ForeignKey('bookings.id'), nullable=True)
    student_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    vendor_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=True)
    ref = db.Column(db.String(100), unique=True, nullable=False)
    student_name = db.Column(db.String(255))
    vendor_name = db.Column(db.String(255))
    route = db.Column(db.String(255))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    type = db.Column(db.String(50), nullable=False) # 'booking', 'refund'
    status = db.Column(db.String(50), default='pending') # 'successful', 'pending', 'failed'
    paystack_ref = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'bookingId': self.booking_id,
            'studentId': self.student_id,
            'vendorId': self.vendor_id,
            'ref': self.ref,
            'studentName': self.student_name,
            'vendorName': self.vendor_name,
            'route': self.route,
            'amount': float(self.amount),
            'type': self.type,
            'status': self.status,
            'paystackRef': self.paystack_ref,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = db.Column(db.String(50), nullable=False) # 'booking', 'payment', 'user', 'vendor', 'alert'
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    recipient_role = db.Column(db.String(50), nullable=False) # 'admin', 'vendor', 'student'
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    booking_ref = db.Column(db.String(100))
    agency = db.Column(db.String(255))
    agency_email = db.Column(db.String(255))
    route = db.Column(db.String(255))
    amount = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'read': self.read,
            'recipientRole': self.recipient_role,
            'recipientId': self.recipient_id,
            'bookingRef': self.booking_ref,
            'agency': self.agency,
            'agencyEmail': self.agency_email,
            'route': self.route,
            'amount': self.amount,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
