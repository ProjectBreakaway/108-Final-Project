from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import desc
import secrets
import bcrypt

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///project.db"
db = SQLAlchemy(app)

question_tags = db.Table('question_tags',
    db.Column('question_id', db.Integer, db.ForeignKey('question.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

question_upvotes = db.Table('question_upvotes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('question_id', db.Integer, db.ForeignKey('question.id'), primary_key=True),
)

answer_upvotes = db.Table('answer_upvotes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('answer_id', db.Integer, db.ForeignKey('answer.id'), primary_key=True)
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(200))


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow())
    upvotes = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    answers = db.relationship('Answer', backref='question', lazy=True)
    tags = db.relationship('Tag', secondary=question_tags, lazy='subquery', backref=db.backref('questions', lazy=True))

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow())
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

    upvoted_questions = db.relationship('Question',
        secondary=question_upvotes,
        backref=db.backref('upvoters', lazy='dynamic'),
        lazy='dynamic'
    )

    upvoted_answers = db.relationship(
        'Answer',
        secondary=answer_upvotes,
        backref=db.backref('upvoters', lazy='dynamic')
    )

    def upvote_question(self, question):
        if not self.has_upvoted_question(question):
            self.upvoted_questions.append(question)
            question.upvotes += 1
            db.session.commit()

    def remove_upvote(self, question):
        if self.has_upvoted_question(question):
            self.upvoted_questions.remove(question)
            question.upvotes -= 1
            db.session.commit()

    def has_upvoted_question(self, question):
        return self.upvoted_questions.filter(
            question_upvotes.c.question_id == question.id
        ).count() > 0

    def upvote_answer(self, answer):
        if not self.has_upvoted_answer(answer):
            self.upvoted_answers.append(answer)
            answer.upvotes += 1
            db.session.commit()

    def remove_answer_upvote(self, answer):
        if self.has_upvoted_answer(answer):
            self.upvoted_answers.remove(answer)
            answer.upvotes -= 1
            db.session.commit()

    def has_upvoted_answer(self, answer):
        return self.upvoted_answers.filter(
            answer_upvotes.c.answer_id == answer.id
        ).count() > 0


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

@app.route('/article')
def write_article():
    return render_template("writeArticle.html")

@app.route('/myquestions')
def my_question():
    return render_template("myQuestions.html")

@app.route('/myanswers')
def my_answer():
    return render_template("myAnswers.html")

@app.route('/questionwithanswers')
def question_with_answers():
    return render_template('questionAndAnswers.html')

@app.route('/searchingResult')
def searchingResult():
    return render_template("searchingResult.html")

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

@app.route('/questions/me', methods=['POST'])
def all_questions_asked():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    username = data.get("username")
    sort_method = data.get("sort", "newest")
    user = User.query.filter_by(username=username).first()
    my_questions = Question.query.filter_by(user_id=user.id).order_by(desc(Question.timestamp)).all()
    if sort_method == "oldest":
        my_questions = Question.query.filter_by(user_id=user.id).order_by(Question.timestamp).all()
    elif sort_method == "upvotes":
        my_questions = Question.query.filter_by(user_id=user.id).order_by(desc(Question.upvotes)).all()
    question_dict = {}
    i = 0
    for question in my_questions:
        total_answers = Answer.query.filter_by(question_id=question.id).count()
        question_dict[i] = [question.title,
                                         question.content,
                                         total_answers,
                                         question.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                                         question.upvotes]
        i += 1
    return jsonify(question_dict), 200

@app.route('/answers/me', methods=['POST'])
def all_answers():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    username = data["username"]
    sort_method = data.get("sort", "newest")
    user = User.query.filter_by(username=username).first()
    my_answers = Answer.query.filter_by(user_id=user.id).order_by(desc(Answer.timestamp)).all()
    if sort_method == "oldest":
        my_answers = Answer.query.filter_by(user_id=user.id).order_by(Answer.timestamp).all()
    elif sort_method == "upvotes":
        my_answers = Answer.query.filter_by(user_id=user.id).order_by(desc(Answer.upvotes)).all()
    answer_dict = {}
    i = 0
    for answer in my_answers:
        question_title = Question.query.filter_by(id=answer.question_id).first().title
        answer_dict[i] = [question_title, answer.content, answer.timestamp.strftime("%Y-%m-%d %H:%M:%S"), answer.upvotes]
        i += 1
    return jsonify(answer_dict), 200


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


@app.route('/login/me', methods=['POST'])
def login_me():
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
    return jsonify({"success": "Question created successfully"}), 20


@app.route("/create/answer", methods=["POST"])
def create_answers():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()

    user = User.query.filter_by(username=data["username"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 400

    question = Question.query.filter_by(title=data["question_title"]).first()

    answer = Answer(
        content=data["answer_content"],
        user_id=user.id,
        question_id=question.id,
    )
    db.session.add(answer)
    db.session.commit()
    return jsonify({"success": "Answer created successfully"}), 200

@app.route("/upvote/question", methods=["PUT"])
def upvote_question():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    question = Question.query.filter_by(title=data["question_title"]).first()
    if user.id == question.user_id:
        return jsonify({"error": "Cannot upvote one's own question"}), 400
    if user.has_upvoted_question(question):
        user.remove_upvote(question)
        return jsonify({"downvote": question.upvotes}), 201
    else:
        user.upvote_question(question)
        return jsonify({"upvote": question.upvotes}), 200


@app.route("/upvote/answer", methods=["PUT"])
def upvote_answer():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    answer = Answer.query.filter_by(content=data["answer_content"]).first()
    if user.id == answer.user_id:
        return jsonify({"error": "Cannot upvote one's own answer"}), 400
    if user.has_upvoted_answer(answer):
        user.remove_answer_upvote(answer)
        return jsonify({"downvote": answer.upvotes}), 201
    else:
        user.upvote_answer(answer)
        return jsonify({"upvote": answer.upvotes}), 200



@app.route('/question/detail', methods=['POST'])
def question_detail():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    question_title = data["question_title"]
    question = Question.query.filter_by(title=question_title).first()
    user_displayed_name = User.query.filter_by(id=question.user_id).first().displayed_name
    total_answers = Answer.query.filter_by(question_id=question.id).count()
    tags = [{"id": tag.id, "name": tag.name, "description": tag.description} for tag in question.tags]
    return jsonify({
        "title": question.title,
        "question_content": question.content,
        "user_displayed_name": user_displayed_name,
        "question_total_answers": total_answers,
        "upvotes": question.upvotes,
        "question_timestamp": question.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "tags": tags,
    }), 200


@app.route('/answers/detail', methods=['POST'])
def answers_detail():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    question_title = data["question_title"]
    sort_method = data["sort"]
    question = Question.query.filter_by(title=question_title).first()
    if sort_method == "newest":
        answers_to_question = Answer.query.filter_by(question_id=question.id).order_by(desc(Answer.timestamp)).all()
    elif sort_method == "oldest":
        answers_to_question = Answer.query.filter_by(question_id=question.id).order_by(Answer.timestamp).all()
    elif sort_method == "upvotes":
        answers_to_question = Answer.query.filter_by(question_id=question.id).order_by(desc(Answer.upvotes)).all()
    else:
        answers_to_question = Answer.query.filter_by(question_id=question.id).order_by(desc(Answer.timestamp)).all()
    answer_dict = {}
    i = 0
    for answer in answers_to_question:
        answer_user = User.query.filter_by(id=answer.user_id).first()
        answer_dict[i] = [answer_user.displayed_name ,answer.content, answer.timestamp.strftime("%Y-%m-%d %H:%M:%S"), answer.upvotes]
        i += 1
    return jsonify(answer_dict), 200

@app.route('/questions/home', methods=['POST'])
def questions_in_homepage():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    any_questions = Question.query.all()
    any_questions_dict = {}
    i = 0
    for question in any_questions:
        if i == 5:
            break
        total_answers = Answer.query.filter_by(question_id=question.id).count()
        user_displayed_name = User.query.filter_by(id=question.user_id).first().displayed_name
        any_questions_dict[i] = [question.title,
                                         question.content,
                                         total_answers,
                                         question.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                                         question.upvotes,
                                 user_displayed_name]
        i += 1
    return jsonify(any_questions_dict), 200

@app.route('/search/all', methods=['POST'])
def searching():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    keywords = data["searching_content"]
    all_questions = Question.query.all()
    result_dict = {}
    i = 0
    for question in all_questions:
        question_title = question.title
        question_content = question.content
        tags = [tag.name for tag in question.tags]
        if keywords in question_title or keywords in question_content:
            user_displayed_name = User.query.filter_by(id=question.user_id).first().displayed_name
            total_answers = Answer.query.filter_by(question_id=question.id).count()
            result_dict[i] = ["question",
                              user_displayed_name,
                              question.title,
                              total_answers,
                              question.upvotes,
                              question.timestamp.strftime("%Y-%m-%d %H:%M:%S")]
        for tag in tags:
            if keywords in tag:
                user_displayed_name = User.query.filter_by(id=question.user_id).first().displayed_name
                total_answers = Answer.query.filter_by(question_id=question.id).count()
                result_dict[i] = ["question",
                                  user_displayed_name,
                                  question.title,
                                  total_answers,
                                  question.upvotes,
                                  question.timestamp.strftime("%Y-%m-%d %H:%M:%S")]
        i += 1

    all_answer = Answer.query.all()
    for answer in all_answer:
        answer_content = answer.content
        if keywords in answer_content:
            user_displayed_name = User.query.filter_by(id=answer.user_id).first().displayed_name
            related_question = Question.query.filter_by(id=answer.question_id).first().title
            result_dict[i] = ["answer",
                              user_displayed_name,
                              related_question,
                              answer_content,
                              answer.upvotes,
                              answer.timestamp.strftime("%Y-%m-%d %H:%M:%S")]
        i += 1

    return jsonify(result_dict), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)