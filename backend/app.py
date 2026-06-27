import os
import json
import time
import cv2
import numpy as np
import psycopg2
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# ── Import the new enhancement engine ────────────────────
from enhancement_engine import ImageAnalyzer, ImageEnhancer, RecommendationEngine, process_image

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── App Config ───────────────────────────────────────────
app.config['SECRET_KEY'] = os.getenv("JWT_SECRET", "super_secret_jwt_key_12345")

# ── Folder configuration ─────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
ENHANCED_FOLDER = os.path.join(BASE_DIR, "enhanced")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ENHANCED_FOLDER, exist_ok=True)

# ── PostgreSQL Configuration ─────────────────────────────
DB_CONFIG = {
    "dbname":   os.getenv("DB_NAME", "image_enhancer"),
    "user":     os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     os.getenv("DB_PORT", "5432"),
}

def get_db_connection():
    """Create and return a new PostgreSQL connection."""
    return psycopg2.connect(**DB_CONFIG)

# ── Database Initialization ──────────────────────────────
def create_tables():
    """Create tables if they don't exist (preserves existing data)."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      VARCHAR(50) UNIQUE NOT NULL,
            email         VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS images (
            id                   SERIAL PRIMARY KEY,
            user_id              INTEGER REFERENCES users(id) ON DELETE CASCADE,
            original_image       TEXT NOT NULL,
            enhanced_image       TEXT,
            blur_level           FLOAT,
            blur_label           VARCHAR(50),
            noise_level          FLOAT,
            noise_label          VARCHAR(50),
            resolution_quality   VARCHAR(50),
            resolution_width     INTEGER,
            resolution_height    INTEGER,
            brightness_score     FLOAT,
            brightness_label     VARCHAR(50),
            contrast_score       FLOAT,
            contrast_label       VARCHAR(50),
            color_score          FLOAT,
            color_label          VARCHAR(50),
            faces_detected       INTEGER DEFAULT 0,
            enhancement_mode     VARCHAR(20) DEFAULT 'balanced',
            enhancements_applied TEXT,
            recommendation       TEXT,
            created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Add columns that may be missing from older schema
    new_columns = [
        ("brightness_score", "FLOAT"),
        ("brightness_label", "VARCHAR(50)"),
        ("contrast_score", "FLOAT"),
        ("contrast_label", "VARCHAR(50)"),
        ("color_score", "FLOAT"),
        ("color_label", "VARCHAR(50)"),
        ("faces_detected", "INTEGER DEFAULT 0"),
        ("enhancement_mode", "VARCHAR(20) DEFAULT 'balanced'"),
        ("enhancements_applied", "TEXT"),
    ]
    for col_name, col_type in new_columns:
        try:
            cur.execute(f"ALTER TABLE images ADD COLUMN {col_name} {col_type};")
        except Exception:
            conn.rollback()

    conn.commit()
    cur.close()
    conn.close()
    print("[OK] Database tables ready.")

create_tables()

# ═══════════════════════════════════════════════════════════
#  AUTHENTICATION DECORATOR
# ═══════════════════════════════════════════════════════════

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'error': 'Token is invalid!', 'message': str(e)}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        current_user_id = None
        if token:
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user_id = data['user_id']
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired!'}), 401
            except Exception as e:
                return jsonify({'error': 'Token is invalid!', 'message': str(e)}), 401
                
        return f(current_user_id, *args, **kwargs)
    return decorated

# ═══════════════════════════════════════════════════════════
#  API ROUTES
# ═══════════════════════════════════════════════════════════

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(data['password'])

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s) RETURNING id;
        """, (data['username'], data['email'], hashed_password))
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'User registered successfully!', 'user_id': user_id}), 201
    except psycopg2.errors.UniqueViolation:
        return jsonify({'error': 'Username or email already exists.'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, username, password_hash FROM users WHERE email = %s;", (data['email'],))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    user_id, username, password_hash = user

    if check_password_hash(password_hash, data['password']):
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({'message': 'Login successful', 'token': token, 'username': username, 'user_id': user_id})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/upload', methods=['POST'])
@optional_token
def upload_file(current_user_id):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Get enhancement mode from form data (default: balanced)
    mode = request.form.get('mode', 'balanced').lower()
    if mode not in ('natural', 'balanced', 'strong'):
        mode = 'balanced'

    try:
        image_bytes = file.read()
        if not image_bytes:
            return jsonify({'error': 'Uploaded file is empty'}), 400

        filename = file.filename
        timestamp = int(time.time())
        original_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(original_path, "wb") as f:
            f.write(image_bytes)

        # Generate unique enhanced filename
        name, ext = os.path.splitext(filename)
        enhanced_filename = f"enhanced_{timestamp}_{name}{ext}"
        enhanced_path = os.path.join(ENHANCED_FOLDER, enhanced_filename)

        # ── Run the full enhancement pipeline ─────────
        print(f"[ENHANCE] Processing '{filename}' in '{mode}' mode...")
        result = process_image(original_path, enhanced_path, mode=mode)
        analysis = result["analysis"]
        recommendations = result["recommendations"]
        enhancements = result["enhancements"]
        print(f"[ENHANCE] Done. {len(enhancements)} enhancements applied.")

        # ── Save to database ──────────────────────────
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO images (
                user_id,
                original_image, enhanced_image,
                blur_level, blur_label,
                noise_level, noise_label,
                resolution_quality, resolution_width, resolution_height,
                brightness_score, brightness_label,
                contrast_score, contrast_label,
                color_score, color_label,
                faces_detected,
                enhancement_mode,
                enhancements_applied,
                recommendation
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """, (
            current_user_id,
            filename, enhanced_filename,
            float(analysis["blur"]["score"]), analysis["blur"]["label"],
            float(analysis["noise"]["score"]), analysis["noise"]["label"],
            analysis["resolution"]["quality"],
            int(analysis["resolution"]["width"]),
            int(analysis["resolution"]["height"]),
            float(analysis["brightness"]["score"]), analysis["brightness"]["label"],
            float(analysis["contrast"]["score"]), analysis["contrast"]["label"],
            float(analysis["color"]["score"]), analysis["color"]["label"],
            int(analysis["faces"]["count"]),
            mode,
            json.dumps(enhancements),
            " • ".join(recommendations),
        ))
        image_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        base_url = request.host_url
        return jsonify({
            "message": "Image enhanced successfully ✅",
            "image": {
                "id": image_id,
                "filename": filename,
                "original_url": f"{base_url}uploads/{filename}",
                "enhanced_url": f"{base_url}enhanced/{enhanced_filename}",
                "analysis": {
                    "blur": analysis["blur"],
                    "noise": analysis["noise"],
                    "resolution": analysis["resolution"],
                    "brightness": analysis["brightness"],
                    "contrast": analysis["contrast"],
                    "color": analysis["color"],
                    "faces": analysis["faces"],
                    "histogram": analysis["histogram"],
                },
                "recommendation": " • ".join(recommendations),
                "recommendations": recommendations,
                "enhancements_applied": enhancements,
                "enhancement_mode": mode,
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

@app.route('/images', methods=['GET'])
@token_required
def list_images(current_user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM images WHERE user_id = %s ORDER BY id DESC;", (current_user_id,))
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        cur.close()
        conn.close()

        base_url = request.host_url
        result = []
        for r in rows:
            record = dict(zip(columns, r))
            fname = record.get("original_image", "")
            record["original_url"] = f"{base_url}uploads/{fname}" if fname else None
            efname = record.get("enhanced_image", "")
            record["enhanced_url"] = f"{base_url}enhanced/{efname}" if efname else None
            if record.get("created_at"):
                record["created_at"] = record["created_at"].isoformat()
            # Parse enhancements_applied from JSON string
            if record.get("enhancements_applied"):
                try:
                    record["enhancements_applied"] = json.loads(record["enhancements_applied"])
                except (json.JSONDecodeError, TypeError):
                    record["enhancements_applied"] = []
            result.append(record)

        return jsonify({"total": len(result), "images": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/images/<int:image_id>', methods=['GET'])
@token_required
def get_image(current_user_id, image_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM images WHERE id = %s AND user_id = %s;", (image_id, current_user_id))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Image not found"}), 404

        columns = [desc[0] for desc in cur.description]
        cur.close()
        conn.close()

        record = dict(zip(columns, row))
        base_url = request.host_url
        fname = record.get("original_image", "")
        record["original_url"] = f"{base_url}uploads/{fname}" if fname else None
        efname = record.get("enhanced_image", "")
        record["enhanced_url"] = f"{base_url}enhanced/{efname}" if efname else None
        if record.get("created_at"):
            record["created_at"] = record["created_at"].isoformat()
        if record.get("enhancements_applied"):
            try:
                record["enhancements_applied"] = json.loads(record["enhancements_applied"])
            except (json.JSONDecodeError, TypeError):
                record["enhancements_applied"] = []

        return jsonify({"image": record})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/enhanced/<filename>', methods=['GET'])
def serve_enhanced(filename):
    return send_from_directory(ENHANCED_FOLDER, filename)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "auth": "enabled", "engine": "enhancement_engine v1.0"})

if __name__ == '__main__':
    app.run(debug=True)