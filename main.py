from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import secrets

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project1.db"
db = SQLAlchemy(app)

def generate_salt():
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    salted_password = salt + password
    return hex(hash(salted_password))[2:]

def verify_password(stored_hash: str, stored_salt: str, input_password: str) -> bool:
    test_hash = hash_password(input_password, stored_salt)
    return secrets.compare_digest(stored_hash, test_hash)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime)

    upvotes = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    answers = db.relationship('Answer', backref='question', lazy=True)

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime)
    upvotes = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    salt = db.Column(db.String(), nullable=False)
    description = db.Column(db.String(), nullable=True)

    questions = db.relationship('Question', backref='author', lazy=True)
    answers = db.relationship('Answer', backref='author', lazy=True)


with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/index.html')
def home():
    return render_template("index.html")

@app.route('/userhome.html')
def userhome():
    return render_template("userhome.html")

@app.route('/login.html')
def login():
    return render_template("login.html")

@app.route('/signup.html')
def create_user_html():
    return render_template("signup.html")

@app.route('/profile.html')
def profile():
    return render_template("profile.html")

@app.route('/profile/<string:username>')
def my_profile(username):
    user = User.query.filter_by(username=username).first()
    user_questions = Question.query.filter_by(user_id=user.id).all()
    user_answers = Answer.query.filter_by(user_id=user.id).all()
    liked = 0
    for question in user_questions:
        liked += question.upvotes
    for answer in user_answers:
        liked += answer.upvotes
    return jsonify({
        'username': user.username,
        'description': user.description,
        'questions': len(user_questions),
        'answers': len(user_answers),
        'liked': liked
    })

@app.route('/settings.html')
def settings():
    return render_template("settings.html")

@app.route('/<string:username>/<string:password>')
def sign_in(username, password):
    if User.query.filter_by(username=username).first():
        user = User.query.filter_by(username=username).first()
        if (password + user.salt) == user.password:
            return jsonify({"success": "User login successfully"}), 201
        else:
            return jsonify({"error": "Incorrect password"}), 401
    else:
        return jsonify({"error": "No username found"}), 402


@app.route("/create/", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exist"}), 404
    salt = generate_salt()
    password = password + salt

    user = User(
        username=username,
        password=password,
        salt=salt,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": "User created successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)