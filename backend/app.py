import os
import bcrypt
from flask import Flask
from flask_cors import CORS
from models import db, User, Profile
from routes import api_bp

def create_app():
    app = Flask(__name__)
    
    # Configure SQLite database
    # This will create unitransit.db inside the backend directory
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'unitransit.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Configure CORS for frontend access
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Initialize DB
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Stub negotiate endpoint for SignalR to avoid front-end socket errors
    @app.route('/notifications/negotiate', methods=['POST'])
    def negotiate():
        return "SignalR protocol stubs are not active on this backend.", 404
        
    with app.app_context():
        db.create_all()
        
        # Seed default admin user if not exists
        admin_email = "unitransit3@gmail.com"
        admin_user = User.query.filter_by(email=admin_email).first()
        if not admin_user:
            hashed_pass = bcrypt.hashpw("admin123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = User(email=admin_email, password_hash=hashed_pass, email_confirmed=True)
            profile = Profile(
                user=user,
                email=admin_email,
                first_name="System",
                last_name="Admin",
                role="admin"
            )
            db.session.add(user)
            db.session.add(profile)
            db.session.commit()
            print("Admin user seeded successfully!")
            
    return app

if __name__ == '__main__':
    app = create_app()
    print("Starting Flask Backend on http://localhost:5129...")
    app.run(host='0.0.0.0', port=5129, debug=True)
