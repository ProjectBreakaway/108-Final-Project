from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import secrets
import bcrypt

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project1.db"
db = SQLAlchemy(app)

question_tags = db.Table('question_tags',
    db.Column('question_id', db.Integer, db.ForeignKey('question.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(200))

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    upvotes = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    answers = db.relationship('Answer', backref='question', lazy=True)
    tags = db.relationship('Tag', secondary=question_tags, lazy='subquery', backref=db.backref('questions', lazy=True))

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
    displayed_name = db.Column(db.String(), nullable=True, default='')
    hashed_password = db.Column(db.String(), nullable=False)
    email = db.Column(db.String(), nullable=True, default='')
    salt = db.Column(db.String(), nullable=False)
    description = db.Column(db.String(), nullable=True)

    questions = db.relationship('Question', backref='author', lazy=True)
    answers = db.relationship('Answer', backref='author', lazy=True)


with app.app_context():
    db.create_all()

    if not Tag.query.first():
        initial_tags = [
            Tag(name='ethics', description='Moral philosophy questions'),
            Tag(name='metaphysics', description='Nature of reality and existence'),
            Tag(name='epistemology', description='Theory of knowledge'),
            Tag(name='political', description='Political philosophy'),
            Tag(name='logic', description='Reasoning and argumentation'),
            Tag(name='aesthetics', description='Philosophy of art and beauty'),
            Tag(name='philosophy-of-mind', description='Consciousness and mental phenomena')
        ]
        db.session.add_all(initial_tags)
        db.session.commit()

def generate_salt():
    return secrets.token_hex(16)

@app.route('/')
def index():
    return render_template("index.html")


@app.route('/index')
def home():
    return render_template("index.html")


@app.route('/userhome')
def userhome():
    return render_template("userhome.html")


@app.route('/login')
def login():
    return render_template("login.html")


@app.route('/signup')
def create_user_html():
    return render_template("signup.html")


@app.route('/profile')
def profile():
    return render_template("profile.html")


@app.route('/settings')
def settings():
    return render_template("settings.html")

@app.route('/question')
def ask_question():
    return render_template("askQuestion.html")

@app.route('/profile/me', methods=['POST'])
def user_profile():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    username = data["username"]
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
        'displayed_name': user.displayed_name,
        'description': user.description,
        'questions': len(user_questions),
        'answers': len(user_answers),
        'liked': liked
    }), 200


@app.route('/settings/me', methods=['POST', 'PUT'])
def user_settings():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    if request.method == 'POST':
        data = request.get_json()
        username = data["username"]
        user = User.query.filter_by(username=username).first()
        user_displayed_name = user.displayed_name
        user_email = user.email
        user_description = user.description
        return jsonify({
            'displayed_name': user_displayed_name,
            'email': user_email,
            'description': user_description,
        }), 200

    data = request.get_json()
    username = data["username"]
    displayed_name = data["displayed_name"]
    email = data["email"]
    description = data["description"]

    if not User.query.filter_by(username=username).first():
        return jsonify({"error": "User does not exist"}), 400

    user = User.query.filter_by(username=username).first()
    user.displayed_name = displayed_name
    user.email = email
    user.description = description
    db.session.commit()
    return jsonify({"success": "Successfully changed settings"}), 200


@app.route('/signin/me/', methods=['POST'])
def sign_in():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if User.query.filter_by(username=username).first():
        user = User.query.filter_by(username=username).first()
        input_password = password + user.salt
        input_password = bytes(input_password, encoding="utf-8")
        if bcrypt.checkpw(input_password, user.hashed_password):
            user_data = {"username": username}
            response = jsonify(user_data)
            response.set_cookie('user_id', str(user_data['username']))
            response.set_cookie('theme', 'dark', max_age=30 * 24 * 60 * 60)
            return jsonify({"success": "User login successfully"}), 200
        else:
            return jsonify({"error": "Incorrect password"}), 400
    else:
        return jsonify({"error": "No username found"}), 400


@app.route("/create/user", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exist"}), 400
    salt = generate_salt()
    password = password + salt
    password = bytes(password, encoding="utf-8")
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

    user = User(
        username=username,
        displayed_name=username,
        hashed_password=hashed_password,
        salt=salt,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": "User created successfully"}), 200


@app.route("/create/question", methods=["POST"])
def create_questions():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    required_fields = ["title", "content", "username"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    user = User.query.filter_by(username=data["username"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 400

    question = Question(
        title=data["title"],
        content=data["content"],
        user_id=user.id
    )
    db.session.add(question)

    if "tags" in data and isinstance(data["tags"], list):
        for tag_name in data["tags"]:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.session.add(tag)
            question.tags.append(tag)

    db.session.commit()
    return jsonify({"success": "Question created successfully"}), 201


@app.route("/create/answer", methods=["POST"])
def create_answers():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    content = data["content"]
    question_title = data["question_title"]
    question_initiator_id = User.query.filter_by(username=data["question_initiator"]).first().id
    question = Question.query.filter_by(title=question_title, user_id=question_initiator_id).first()
    user_id = User.query.filter_by(username=data["user_id"]).first().id
    answer = Answer(content=content, user_id=user_id, question_id=question.id)
    db.session.add(answer)
    db.session.commit()
    return jsonify({"success": "Answer created successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)
