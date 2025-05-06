from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import secrets

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
db = SQLAlchemy(app)

def generate_salt():
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    salted_password = salt + password
    return hex(hash(salted_password))[2:]

def verify_password(stored_hash: str, stored_salt: str, input_password: str) -> bool:
    test_hash = hash_password(input_password, stored_salt)
    return secrets.compare_digest(stored_hash, test_hash)

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    questionId = db.Column(db.Integer, db.ForeignKey("question.id"), nullable=False)
    commentId = db.Column(db.Integer, db.ForeignKey("comment.id"), nullable=True, default=0)
    tag = db.Column(db.String, nullable=True)
    question = db.relationship('Question', backref='disciplines')
    comment = db.relationship('Comment', backref='disciplines')


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(), unique=True, nullable=False)
    text = db.Column(db.String(), nullable=True)
    userId = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    likeness = db.Column(db.Integer, nullable=True, default=0)


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(), nullable=False)
    userId = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    likeness = db.Column(db.Integer, nullable=True, default=0)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    salt = db.Column(db.String(), nullable=False)
    description = db.Column(db.String(), nullable=True)


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/index.html')
def home():
    return render_template("index.html")

@app.route('/login.html')
def login():
    return render_template("login.html")

@app.route('/signup.html')
def create_user_html():
    return render_template("signup.html")

@app.route('/profile.html')
def profile():
    return render_template("profile.html")

@app.route('/settings.html')
def settings():
    return render_template("settings.html")

@app.route('/<string:username>/<string:password>')
def sign_in(username, password):
    if User.query.filter_by(username=username).first():
        user = User.query.filter_by(username=username).first()
        if verify_password(user.password, user.salt, password):
            return jsonify({"success": "User created successfully"}), 201
        else:
            return jsonify({"error": "Incorrect password"}), 401
    else:
        return jsonify({"error": "No username found"}), 401


@app.route("/create/", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exist"}), 404
    salt = generate_salt()
    hashed_password = hash_password(password, salt)

    user = User(
        username=username,
        password=hashed_password,
        salt=salt,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": "User created successfully"}), 200


@app.route("/create/question/<string:username>", methods=["POST"])
def create_question(username):
    data = request.get_json()
    title = data["title"]
    text = data["text"]
    userId = 0
    if User.query.filter_by(username=username).first():
        userId = User.query.filter_by(username=username).first().id

    question = Question(
        title=title,
        text=text,
        userId=userId,
    )
    db.session.add(question)
    db.session.commit()

    questionId = Question.query.filter_by(title=title).first().id
    for tag in data["tags"]:
        topic = Topic(
            questionId=questionId,
            tag=tag,
        )
        db.session.add(topic)
        db.session.commit()

    return render_template("index.html")


@app.route("/create/question/<string:question_title>/comment/<string:username>", methods=["POST"])
def create_comment(question_title, username):
    data = request.get_json()
    text = data["text"]
    userId = 0
    if User.query.filter_by(username=username).first():
        userId = User.query.filter_by(username=username).first().id

    comment = Comment(
        text=text,
        userId=userId,
    )
    db.session.add(comment)
    db.session.commit()

    question = Question.query.filter_by(title=question_title).first()
    topics = Topic.query.filter_by(questionId=question.id).all()
    commentId = Comment.query.filter_by(text=text).first().id
    for topic in topics:
        entry = Topic(
            questionId=question.id,
            tag=topic,
            commentId=commentId,
        )
        db.session.add(entry)
        db.session.commit()

    return render_template("index.html")

@app.route("/delete/question/<string:question_title>", methods=["DELETE"])
def delete_question(question_title):
    question = Question.query.filter_by(title=question_title).first()
    Topic.query.filter_by(questionId=question.id).delete()
    db.session.delete(question)
    db.session.commit()
    return jsonify({"success": "Question deleted successfully"})


@app.route("/delete/comment/<string:text>", methods=["DELETE"])
def delete_comment(text):
    comment = Comment.query.filter_by(text=text).first()
    Topic.query.filter_by(commentId=comment.id).delete()
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"success": "Comment deleted successfully"})


@app.route("/delete/user/<string:username>", methods=["DELETE"])
def delete_user(username):
    user = User.query.filter_by(username=username).first()
    Question.query.filter_by(userId=user.id).delete()
    Comment.query.filter_by(commentId=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": "User deleted successfully"})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        app.run(debug=True)
        db.drop_all()