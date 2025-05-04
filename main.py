from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
db = SQLAlchemy(app)


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
    description = db.Column(db.String(), nullable=True)


@app.route('/')
def index():
    return render_template("index.html")

@app.route('/login.html')
def login():
    return render_template("login.html")

@app.route('/createUser.html')
def create_user_html():
    return render_template("createUser.html")

@app.route("/create/user", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    confirmPassword = data["confirmPassword"]

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exist"}), 404

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400

    if password != confirmPassword:
        return jsonify({"error": "Passwords don't match"}), 403

    user = User(
        username=username,
        password=password,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": "User created successfully"}), 404


@app.route("/create/question/<string:username>", methods=["GET", "POST"])
def create_question(username):
    if request.method == 'GET':
        return render_template("createQuestion.html")

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


@app.route("/create/question/<string:question_title>/comment/<string:username>", methods=["GET", "POST"])
def create_comment(question_title, username):
    if request.method == 'GET':
        return render_template("createComment.html")

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
