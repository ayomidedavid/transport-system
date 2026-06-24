import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify
from models import db, User, Profile, Vendor, Trip, Booking, Transaction, Notification

api_bp = Blueprint('api', __name__)

JWT_SECRET = "YOUR_SUPER_SECRET_JWT_KEY_THAT_IS_LONG_ENOUGH"
JWT_ISSUER = "UniTransit"
JWT_AUDIENCE = "UniTransit"

def generate_jwt(user, role):
    payload = {
        'sub': user.id,
        'email': user.email,
        'role': role,
        'iss': JWT_ISSUER,
        'aud': JWT_AUDIENCE,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, audience=JWT_AUDIENCE, issuers=[JWT_ISSUER], algorithms=['HS256'])
            user_id = payload['sub']
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 401
            request.user = user
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated


# ────────────────────────────────────────────────────────────────
# AUTHENTICATION ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/auth/me', methods=['GET'])
@require_auth
def get_me():
    user = request.user
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    return jsonify({
        'id': user.id,
        'email': user.email,
        'firstName': profile.first_name,
        'lastName': profile.last_name,
        'phone': profile.phone,
        'matric': profile.matric,
        'department': profile.department,
        'studentId': profile.student_id,
        'accountType': 'logistics' if profile.role == 'vendor' else profile.role
    })


@api_bp.route('/auth/signup', methods=['POST'])
def signup():
    req = request.json or {}
    email = req.get('email', '').strip().lower()
    password = req.get('password', '')
    first_name = req.get('firstName', '').strip()
    last_name = req.get('lastName', '').strip()
    phone = req.get('phone', '')
    matric = req.get('matric', '')
    department = req.get('department', '')
    student_id = req.get('studentId', '')
    
    if not email or not password or not first_name or not last_name:
        return jsonify({'error': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists.'}), 400
        
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = User(email=email, password_hash=hashed, email_confirmed=True)
    profile = Profile(
        user=user,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        matric=matric,
        department=department,
        student_id=student_id,
        role='student'
    )
    
    db.session.add(user)
    db.session.add(profile)
    db.session.commit()
    
    token = generate_jwt(user, 'student')
    
    return jsonify({
        'ok': True,
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'firstName': profile.first_name,
            'lastName': profile.last_name,
            'phone': profile.phone,
            'matric': profile.matric,
            'department': profile.department,
            'studentId': profile.student_id,
            'accountType': 'student'
        }
    })


@api_bp.route('/auth/vendor-signup', methods=['POST'])
def vendor_signup():
    req = request.json or {}
    email = req.get('email', '').strip().lower()
    password = req.get('password', '')
    contact_name = req.get('contactName', '').strip()
    company_name = req.get('companyName', '').strip()
    reg_number = req.get('regNumber', '')
    phone = req.get('phone', '')
    address = req.get('address', '')
    
    if not email or not password or not contact_name or not company_name:
        return jsonify({'error': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists.'}), 400
        
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Split name
    name_parts = contact_name.split(' ', 1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    user = User(email=email, password_hash=hashed, email_confirmed=True)
    profile = Profile(
        user=user,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role='vendor'
    )
    
    # Vendor Id should match User Id
    vendor = Vendor(
        id=user.id,
        owner_id=user.id,
        name=company_name,
        registration_number=reg_number,
        contact_person=contact_name,
        email=email,
        phone=phone,
        address=address,
        verification_status='pending'
    )
    
    db.session.add(user)
    db.session.add(profile)
    db.session.add(vendor)
    db.session.commit()
    
    token = generate_jwt(user, 'vendor')
    
    # Send admin notification about registration
    admin_notif = Notification(
        type='vendor_approval',
        title='New Vendor Registration',
        body=f"A new logistics company ({vendor.name}) has registered and is pending your approval.",
        recipient_role='admin'
    )
    db.session.add(admin_notif)
    db.session.commit()
    
    return jsonify({
        'ok': True,
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'firstName': profile.first_name,
            'lastName': profile.last_name,
            'phone': profile.phone,
            'accountType': 'logistics'
        },
        'vendor': vendor.to_dict()
    })


@api_bp.route('/auth/login', methods=['POST'])
def login():
    req = request.json or {}
    email = req.get('email', '').strip().lower()
    password = req.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials.'}), 401
        
    if not user.email_confirmed:
        return jsonify({'error': 'Email not confirmed'}), 401
        
    profile = user.profile
    role = profile.role if profile else 'student'
    token = generate_jwt(user, role)
    
    return jsonify({
        'ok': True,
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'firstName': profile.first_name if profile else "",
            'lastName': profile.last_name if profile else "",
            'phone': profile.phone if profile else "",
            'matric': profile.matric if profile else None,
            'department': profile.department if profile else None,
            'studentId': profile.student_id if profile else None,
            'accountType': 'logistics' if role == 'vendor' else role
        }
    })


@api_bp.route('/auth/profile', methods=['PUT'])
@require_auth
def update_profile():
    user = request.user
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    req = request.json or {}
    if 'firstName' in req: profile.first_name = req['firstName']
    if 'lastName' in req: profile.last_name = req['lastName']
    if 'phone' in req: profile.phone = req['phone']
    if 'department' in req: profile.department = req['department']
    
    db.session.commit()
    return jsonify({'ok': True})


# Stubs to prevent frontend failure
@api_bp.route('/auth/send-otp', methods=['POST'])
def send_otp():
    return jsonify({'ok': True})

@api_bp.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    return jsonify({'ok': True})

@api_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    return jsonify({'ok': True})


# ────────────────────────────────────────────────────────────────
# VENDOR ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/vendors', methods=['GET'])
def get_vendors():
    vendors = Vendor.query.all()
    return jsonify([v.to_dict() for v in vendors])


@api_bp.route('/vendors/<id>', methods=['GET'])
def get_vendor(id):
    vendor = Vendor.query.get(id)
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
    return jsonify(vendor.to_dict())


@api_bp.route('/vendors/owner/<ownerId>', methods=['GET'])
def get_vendor_by_owner(ownerId):
    vendor = Vendor.query.filter_by(owner_id=ownerId).first()
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
    return jsonify(vendor.to_dict())


# ────────────────────────────────────────────────────────────────
# TRIP ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/trips', methods=['GET'])
def get_active_trips():
    trips = Trip.query.filter_by(status='active').all()
    return jsonify([t.to_dict() for t in trips])


@api_bp.route('/trips/vendor/<vendorId>', methods=['GET'])
def get_vendor_trips(vendorId):
    trips = Trip.query.filter_by(vendor_id=vendorId).order_by(Trip.created_at.desc()).all()
    return jsonify([t.to_dict() for t in trips])


@api_bp.route('/trips', methods=['POST'])
def create_trip():
    req = request.json or {}
    vendor_id = req.get('vendorId')
    origin = req.get('origin')
    destination = req.get('destination')
    departure_date = req.get('departureDate')
    departure_time = req.get('departureTime')
    arrival_time = req.get('arrivalTime')
    vehicle_type = req.get('vehicleType')
    total_seats = int(req.get('totalSeats', 0))
    available_seats = int(req.get('availableSeats', total_seats))
    price = req.get('price')
    status = req.get('status', 'active')
    
    if not vendor_id or not origin or not destination or not departure_date or not departure_time or total_seats <= 0 or price is None:
        return jsonify({'error': 'Missing required fields'}), 400
        
    trip = Trip(
        vendor_id=vendor_id,
        origin=origin,
        destination=destination,
        departure_date=departure_date,
        departure_time=departure_time,
        arrival_time=arrival_time,
        vehicle_type=vehicle_type,
        total_seats=total_seats,
        available_seats=available_seats,
        price=price,
        status=status
    )
    
    # Increment total trips count for vendor
    vendor = Vendor.query.get(vendor_id)
    if vendor:
        vendor.total_trips += 1
        
    db.session.add(trip)
    db.session.commit()
    
    return jsonify(trip.to_dict()), 210 # CreatedAtAction maps to status 201/210 etc. Let's return 201.


# ────────────────────────────────────────────────────────────────
# BOOKING ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/bookings/student/<studentId>', methods=['GET'])
def get_student_bookings(studentId):
    bookings = Booking.query.filter_by(student_id=studentId).order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


@api_bp.route('/bookings/vendor/<vendorId>', methods=['GET'])
def get_vendor_bookings(vendorId):
    bookings = Booking.query.filter_by(vendor_id=vendorId).order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


@api_bp.route('/bookings', methods=['POST'])
def create_booking():
    req = request.json or {}
    student_id = req.get('studentId')
    trip_id = req.get('tripId')
    route = req.get('route')
    company = req.get('company')
    destination = req.get('destination')
    date = req.get('date')
    time = req.get('time')
    pickup = req.get('pickup')
    seat = req.get('seat')
    ref = req.get('ref')
    amount = req.get('amount')
    price_num = req.get('priceNum')
    
    if not student_id or not trip_id or not route or not company or not destination or not date or not ref:
        return jsonify({'error': 'Missing required fields'}), 400
        
    trip = Trip.query.get(trip_id)
    if not trip or trip.status != 'active':
        return jsonify({'error': 'Trip is not available.'}), 400
        
    if trip.available_seats <= 0:
        return jsonify({'error': 'No seats available.'}), 400
        
    # Atomically book seat
    trip.available_seats -= 1
    
    booking = Booking(
        student_id=student_id,
        trip_id=trip_id,
        vendor_id=trip.vendor_id,
        route=route,
        company=company,
        destination=destination,
        vehicle_type=trip.vehicle_type,
        date=date,
        time=time,
        pickup=pickup,
        seat=seat,
        ref=ref,
        amount=amount,
        price_num=price_num,
        status='pending'
    )
    
    db.session.add(booking)
    db.session.commit()
    
    return jsonify(booking.to_dict())


@api_bp.route('/bookings/<id>/cancel', methods=['POST'])
def cancel_booking(id):
    req = request.json or {}
    student_id = req.get('studentId')
    
    booking = Booking.query.get(id)
    if not booking or (student_id and booking.student_id != student_id):
        return jsonify({'error': 'Booking not found.'}), 404
        
    if booking.status == 'cancelled':
        return jsonify({'error': 'Booking is already cancelled.'}), 400
        
    booking.status = 'cancelled'
    
    # Refund seat
    if booking.trip_id:
        trip = Trip.query.get(booking.trip_id)
        if trip:
            trip.available_seats += 1
            
    db.session.commit()
    return jsonify({'ok': True})


# ────────────────────────────────────────────────────────────────
# TRANSACTION ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/transactions/student/<studentId>', methods=['GET'])
def get_student_transactions(studentId):
    txs = Transaction.query.filter_by(student_id=studentId).order_by(Transaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in txs])


@api_bp.route('/transactions/vendor/<vendorId>', methods=['GET'])
def get_vendor_transactions(vendorId):
    txs = Transaction.query.filter_by(vendor_id=vendorId).order_by(Transaction.created_at.desc()).all()
    return jsonify([t.to_dict() for t in txs])


@api_bp.route('/transactions', methods=['POST'])
def create_transaction():
    req = request.json or {}
    # Convert keys to lowercase snake case
    tx = Transaction(
        id=req.get('id', str(uuid.uuid4())),
        booking_id=req.get('bookingId'),
        student_id=req.get('studentId'),
        vendor_id=req.get('vendorId'),
        ref=req.get('ref'),
        student_name=req.get('studentName'),
        vendor_name=req.get('vendorName'),
        route=req.get('route'),
        amount=req.get('amount'),
        type=req.get('type'),
        status=req.get('status', 'pending'),
        paystack_ref=req.get('paystackRef')
    )
    db.session.add(tx)
    db.session.commit()
    return jsonify(tx.to_dict())


# ────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/admin/dashboard', methods=['GET'])
def get_admin_dashboard():
    profiles = Profile.query.all()
    vendors = Vendor.query.all()
    bookings = Booking.query.order_by(Booking.created_at.desc()).limit(100).all()
    transactions = Transaction.query.order_by(Transaction.created_at.desc()).limit(100).all()
    
    users_data = []
    for p in profiles:
        users_data.append({
            'id': p.id,
            'firstName': p.first_name,
            'lastName': p.last_name,
            'email': p.email,
            'phone': p.phone,
            'matric': p.matric,
            'department': p.department,
            'role': p.role,
            'joinedAt': p.created_at.isoformat() if p.created_at else None
        })
        
    vendors_data = []
    for v in vendors:
        vendors_data.append({
            'id': v.id,
            'name': v.name,
            'email': v.email,
            'phone': v.phone,
            'address': v.address,
            'contactPerson': v.contact_person,
            'registrationNumber': v.registration_number,
            'verificationStatus': v.verification_status,
            'status': 'active',
            'createdAt': v.created_at.isoformat() if v.created_at else None
        })
        
    bookings_data = []
    for b in bookings:
        student_name = ""
        student_email = ""
        try:
            if b.student and b.student.profile:
                student_name = f"{b.student.profile.first_name} {b.student.profile.last_name}".strip()
                student_email = b.student.email
        except:
            pass
            
        bookings_data.append({
            'id': b.id,
            'ref': b.ref,
            'studentName': student_name,
            'studentEmail': student_email,
            'vendorName': b.vendor.name if b.vendor else b.company,
            'route': b.route,
            'date': b.date,
            'amount': float(b.price_num) if b.price_num else 0.00,
            'status': b.status,
            'createdAt': b.created_at.isoformat() if b.created_at else None
        })
        
    return jsonify({
        'users': users_data,
        'vendors': vendors_data,
        'bookings': bookings_data,
        'transactions': [t.to_dict() for t in transactions]
    })


@api_bp.route('/admin/vendors/<id>/approve', methods=['POST'])
def approve_vendor(id):
    vendor = Vendor.query.get(id)
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
        
    vendor.verification_status = 'approved'
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/vendors/<id>/reject', methods=['POST'])
def reject_vendor(id):
    req = request.json or {}
    reason = req.get('reason', '')
    
    vendor = Vendor.query.get(id)
    if not vendor:
        return jsonify({'error': 'Vendor not found'}), 404
        
    vendor.verification_status = 'rejected'
    vendor.rejection_reason = reason
    db.session.commit()
    return jsonify({'ok': True})


# ────────────────────────────────────────────────────────────────
# NOTIFICATION ENDPOINTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications():
    user = request.user
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    role = profile.role
    is_admin = (role == 'admin')
    
    query = Notification.query
    if is_admin:
        query = query.filter((Notification.recipient_role == 'admin') | (Notification.recipient_id == user.id))
    else:
        query = query.filter(Notification.recipient_id == user.id)
        
    notifs = query.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifs])


@api_bp.route('/notifications', methods=['POST'])
@require_auth
def add_notification():
    user = request.user
    role = user.profile.role if user.profile else 'student'
    if role == 'logistics': role = 'vendor'
    
    req = request.json or {}
    notif = Notification(
        type=req.get('type'),
        title=req.get('title'),
        body=req.get('body'),
        recipient_id=user.id,
        recipient_role=role,
        booking_ref=req.get('bookingRef'),
        agency=req.get('agency'),
        agency_email=req.get('agencyEmail'),
        route=req.get('route'),
        amount=req.get('amount')
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify(notif.to_dict())


@api_bp.route('/notifications/notify-admin', methods=['POST'])
@require_auth
def notify_admin():
    req = request.json or {}
    notif = Notification(
        type=req.get('type'),
        title=req.get('title'),
        body=req.get('body'),
        recipient_role='admin'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify(notif.to_dict())


@api_bp.route('/notifications/read-all', methods=['POST'])
@require_auth
def mark_all_read():
    user = request.user
    unread = Notification.query.filter_by(recipient_id=user.id, read=False).all()
    for n in unread:
        n.read = True
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/notifications/<id>', methods=['DELETE'])
@require_auth
def delete_notification(id):
    notif = Notification.query.get(id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404
        
    user = request.user
    if notif.recipient_id != user.id and notif.recipient_role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
        
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'ok': True})


# ────────────────────────────────────────────────────────────────
# MOCK PAYMENTS
# ────────────────────────────────────────────────────────────────

@api_bp.route('/payments/initialize', methods=['POST'])
def initialize_payment():
    req = request.json or {}
    email = req.get('email')
    amount = req.get('amount')
    reference = req.get('reference')
    booking_id = req.get('bookingId')
    
    if not email or amount is None:
        return jsonify({'error': 'Email and amount are required'}), 400
        
    # Dynamically read origin or fallback to local Vite port
    origin = request.headers.get('Origin') or 'http://localhost:5173'
    # Clean trailing slashes
    origin = origin.rstrip('/')
    
    # Directly link authorization_url to our /verify-payment page in the frontend
    authorization_url = f"{origin}/verify-payment?reference={reference}"
    
    # Store or log if needed, then return url
    return jsonify({
        'authorization_url': authorization_url
    })


@api_bp.route('/payments/verify/<reference>', methods=['GET'])
def verify_payment(reference):
    booking = Booking.query.filter_by(ref=reference).first()
    if not booking:
        return jsonify({'message': 'Booking not found.'}), 404
        
    booking.status = 'confirmed'
    
    # Update vendor revenue & bookings count
    vendor = Vendor.query.get(booking.vendor_id)
    if vendor:
        vendor.total_bookings += 1
        if booking.price_num:
            vendor.total_revenue += booking.price_num
            
    # Find or create corresponding transaction
    tx = Transaction.query.filter_by(ref=reference).first()
    if not tx:
        tx = Transaction(
            booking_id=booking.id,
            student_id=booking.student_id,
            vendor_id=booking.vendor_id,
            ref=reference,
            student_name=f"{booking.student.profile.first_name} {booking.student.profile.last_name}" if booking.student and booking.student.profile else "Student",
            vendor_name=vendor.name if vendor else booking.company,
            route=booking.route,
            amount=booking.price_num or 0.00,
            type='booking',
            status='successful',
            paystack_ref=reference
        )
        db.session.add(tx)
    else:
        tx.status = 'successful'
        tx.paystack_ref = reference
        
    # Create success notifications
    student_notif = Notification(
        type='payment',
        title='Booking Confirmed',
        body=f"Your payment was successful and your seat reservation for route {booking.route} has been confirmed.",
        recipient_role='student',
        recipient_id=booking.student_id,
        booking_ref=booking.ref,
        amount=booking.amount
    )
    
    vendor_notif = Notification(
        type='booking',
        title='New Confirmed Booking',
        body=f"A new student has booked a seat on route {booking.route}.",
        recipient_role='vendor',
        recipient_id=booking.vendor_id,
        booking_ref=booking.ref,
        amount=booking.amount
    )
    
    db.session.add(student_notif)
    db.session.add(vendor_notif)
    db.session.commit()
    
    return jsonify({
        'ok': True,
        'message': 'Payment confirmed successfully'
    })
