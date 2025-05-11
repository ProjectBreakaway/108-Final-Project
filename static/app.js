const url = "";

function logIn() {
    let username_login = document.getElementById("username_login").value;
    let password_login = document.getElementById("password_login").value;
    fetch(`${url}/login/me`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username_login,
            "password": password_login,
        })
    })
        .then(response => {
            if (response.status != 400) {
                document.cookie = `username=${username_login}; login=${true}; question_title=; searching_content=`;
                window.location.href = "userhome";
            } else {
                window.location.href = "login";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function signUp() {
    const username_signup = document.getElementById("username_signup").value.trim();
    const password_signup = document.getElementById("password_signup").value;
    const confirm_password = document.getElementById("confirm_password").value;
    const error_element = document.getElementById("signup-error");

    function showError(message) {
        error_element.textContent = message;
        error_element.style.display = "block";
        error_element.style.color = "#e74c3c";
    }

    if (!username_signup || !password_signup || !confirm_password) {
        showError("Please fill in all fields");
        return;
    }

    if (username_signup.length < 4) {
        showError("Username must be at least 4 characters");
        return;
    }

    if (password_signup.length < 8) {
        showError("Password must be at least 8 characters");
        return;
    }

    if (password_signup !== confirm_password) {
        showError("Passwords do not match");
        return;
    }

    fetch(`${url}/create/user`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username_signup,
            "password": password_signup,
        })
    })
        .then(response => {
            if (response.status != 400) {
                document.cookie = `username=${username_signup}; login=${true}`;
                window.location.href = "userhome";
            } else {
                window.location.href = "signup";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded',
    function openUserProfile() {
        let username = getCookie('username')
        fetch(`${url}/profile/me`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "username": username,
            })
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('username_in_profile').innerHTML = ('(username:    ' + data.username + ')');
                document.getElementById('displayed_name').innerHTML = data.displayed_name;
                document.getElementById('description').innerHTML = data.description;
                document.getElementById('totalQuestions').innerHTML = data.questions;
                document.getElementById('totalAnswers').innerHTML = data.answers;
                document.getElementById('totalLike').innerHTML = data.liked;
            })
            .catch(err => console.error(err));
    });

document.addEventListener('DOMContentLoaded',
    function openUserSettings() {
        let username = getCookie('username');

        fetch(`${url}/settings/me`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "username": username,
            })
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('displayed_name_in_settings').value = data.displayed_name;
                document.getElementById('email_in_settings').value = data.email;
                document.getElementById('description_in_settings').value = data.description;
            })
            .catch(err => console.error(err));
    });

document.addEventListener('DOMContentLoaded',
    function displayQuestionsAsked() {
        let username = getCookie('username');
        const sortButtons = document.querySelectorAll('.sort-btn');

        fetchAndDisplayQuestions('upvotes');

        sortButtons.forEach(button => {
            button.addEventListener('click', function () {
                sortButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                fetchAndDisplayQuestions(this.dataset.sort);
            });
        });

        function fetchAndDisplayQuestions(sortMethod) {
            fetch(`${url}/questions/me`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "username": username,
                    sort: sortMethod
                })
            })
                .then(response => response.json())
                .then(data => {
                    const questions_body = document.getElementById('questions_body')
                    questions_body.innerHTML = '';
                    for (const [_, [title, content, total_answers, timestamp, upvotes]] of Object.entries(data)) {
                        const item = `<li class="question-item">
                    <h3 class="question-title"><a onclick="openQuestion('${title}')">${title}</a></h3>
                    <p class="question-excerpt">${content}</p>
                    <div class="question-meta">
                    <span class="question-stat">${upvotes} approval</span>
                    <span class="question-stat">${total_answers} comments</span>
                    <span class="question-stat">${timestamp}</span>
                    </div>
                </li>`;
                        questions_body.innerHTML += item;
                    }
                })
                .catch(err => console.error(err));
        }
    });

document.addEventListener('DOMContentLoaded',
    function displayAllAnswers() {
        let username = getCookie('username');
        const sortButtons = document.querySelectorAll('.sort-btn');
        fetchAndDisplayQuestions('upvotes');

        sortButtons.forEach(button => {
            button.addEventListener('click', function () {
                sortButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                fetchAndDisplayQuestions(this.dataset.sort);
            });
        });

        function fetchAndDisplayQuestions(sortMethod) {
            fetch(`${url}/answers/me`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "username": username,
                    sort: sortMethod
                })
            })
                .then(response => response.json())
                .then(data => {
                    const answers_body = document.getElementById('answers_body')
                    answers_body.innerHTML = '';
                    for (const [_, [question_title, answer_content, timestamp, upvotes]] of Object.entries(data)) {
                        const item = `<li class="answer-item">
                    <p class="answer-question">In response to: <a onclick="openQuestion('${question_title}')">${question_title}</a></p>
                    <div class="answer-content">
                        <p>${answer_content}</p>
                    </div>
                    <div class="answer-meta">
                        <span class="answer-stat">${upvotes} approval</span>
                        <span class="answer-stat">${timestamp}</span>
                        <button class="action-btn">Edit</button>
                        <button class="action-btn">Delete</button>
                    </div>
                </li>`;
                        answers_body.innerHTML += item;
                    }
                })
                .catch(err => console.error(err));
        }
    });

document.addEventListener('DOMContentLoaded',
    function displayQuestionDetail() {
        let question_title = getCookie('question_title');
        let current_username = getCookie('username')

        fetch(`${url}/question/detail`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "question_title": question_title,
                "current_username": current_username,
            })
        })
            .then(response => response.json())
            .then(data => {
                const question_container = document.getElementById("question_container");
                const item = `<div class="question-header">
                <h1 class="question-title">${data["title"]}</h1>
            </div>

            <div class="question-meta">
                <div class="question-author">
                    <div class="author-avatar">Ph</div>
                    <span>${data["user_displayed_name"]}</span>
                </div>
                <span>•</span>
                <span>${data["question_timestamp"]}</span>
            </div>

            <div class="question-content">
                <p>${data["question_content"]}</p>
            </div>

            <div class="question-tags" id="tag_body">
            </div>

            <div class="question-actions" id="options">
                <button class="action-btn">${data["upvotes"]} Approval</button>
                <button class="action-btn">${data["question_total_answers"]} Answers</button>
                <button type="submit" id="like_button" class="action-btn" onclick="
                    document.cookie = 'question_title=${question_title}';upvote_question()">❤ Like</button>
            </div>`;
                question_container.innerHTML += item;

                const like_button = document.getElementById("like_button")
                if (data["has_upvoted"] === true || data["same_person"] === true) {
                    like_button.classList.remove("active");
                    like_button.disabled = false;
                } else {
                    like_button.classList.add("active");
                    like_button.disabled = true;
                }

                const tag_body = document.getElementById('tag_body')
                tag_body.innerHTML = ''
                for (const tag of Object.entries(data["tags"])) {
                    const item = `<span class="tag">${tag[1]['name']}</span>`;
                    tag_body.innerHTML += item;
                }
            })
            .catch(err => console.error(err));
    });

document.addEventListener('DOMContentLoaded',
    function displayAnswersDetail() {
        let question_title = getCookie('question_title');

        const sortButtons = document.querySelectorAll('.sort-btn');
        fetchAndDisplayQuestions('upvotes');

        sortButtons.forEach(button => {
            button.addEventListener('click', function () {
                sortButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                fetchAndDisplayQuestions(this.dataset.sort);
            });
        });

        function fetchAndDisplayQuestions(sortMethod) {
            fetch(`${url}/answers/detail`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "question_title": question_title,
                    "sort": sortMethod
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    const all_answers = document.getElementById("all_answers");
                    all_answers.innerHTML = "";

                    for (const [_, [answerer_name, answer_content, timestamp, upvotes]] of Object.entries(data)) {
                        const item = `<div class="answer-header">
                    <div class="answer-author">
                        <div class="answer-avatar">Ph</div>
                        <div class="answer-info">
                            <h4>${answerer_name}</h4>
                        </div>
                    </div>
                    <span class="answer-time">${timestamp}</span>
                </div>

                <div class="answer-content">
                    <p>${answer_content}</p>
                </div>
                <div class="answer-actions">
                    <button class="action-btn">${upvotes} Approval</button>
                    <button type="button" class="action-btn" id="like_button_answer" onclick="upvote_answer('${answer_content}')">❤ Like</button>
                </div>`;
                        all_answers.innerHTML += item;
                    }
                })
                .catch(err => console.error(err));
        }

    });

document.addEventListener('DOMContentLoaded',
    function displayQuestionsInHomePage() {

        fetch(`${url}/questions/home`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        })
            .then(response => response.json())
            .then(data => {
                const main_page_content = document.getElementById('main_page_content')
                main_page_content.innerHTML = '';
                const head = `<div class="feed-tabs">
                <div class="feed-tab active">Recommended</div>
            </div>`
                main_page_content.innerHTML += head;
                for (const [_, [question_title, question_content, total_answers, timestamp, upvotes, questioner_name]] of Object.entries(data)) {
                    const item = `<div class="question-card">
                <h2 class="question-title"><a onclick="openQuestion('${question_title}')">${question_title}</a></h2>
                <div class="answer-excerpt">
                    <span class="answer-author">${questioner_name}:</span> ${question_content}
                </div>
                <div class="answer-meta">
                    <div class="answer-action">${upvotes} approval</div>
                    <div class="answer-action"><button class="nothing">${total_answers} comments</button></div>
                    <div class="answer-action"><button type="button" id="like_button" class="nothing" onclick="
                    document.cookie = 'question_title=${question_title}';upvote_question()">❤ Like</button></div>
                </div>
            </div>`;
                    main_page_content.innerHTML += item;
                }
            })
            .catch(err => console.error(err));
    });

function change_user_settings() {
    const displayed_name = document.getElementById('displayed_name_in_settings').value;
    const email = document.getElementById('email_in_settings').value;
    const description = document.getElementById('description_in_settings').value;
    let username = getCookie('username');

    fetch(`${url}/settings/me`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username,
            "displayed_name": displayed_name,
            "email": email,
            "description": description,
        })
    })
        .then(response => {
            if (response.status != 400) {
                window.location.href = "profile";
            } else {
                window.location.href = "settings";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function createQuestion() {
    const question_title = document.getElementById('question_title').value.trim();
    const question_content = document.getElementById('question_content').value.trim();
    const error_element = document.getElementById("title_error");
    let username = getCookie('username');

    function showError(message) {
        error_element.textContent = message;
        error_element.style.display = "block";
        error_element.style.color = "#e74c3c";
    }

    if (!question_title) {
        showError("Question title cannot be empty");
        return;
    }

    const tagElements = document.querySelectorAll('.tags-input .tag');
    const tags = Array.from(tagElements).map(tag => {
        return tag.childNodes[0].nodeValue.trim();
    }).filter(tag => tag !== question_title);

    const requestData = {
        "username": username,
        "title": question_title,
        "content": question_content,
        "tags": tags
    };

    fetch(`${url}/create/question`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (response.status != 400) {
                window.location.href = "userhome";
            } else {
                window.location.href = "question";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function createArticle() {
    const article_title = document.getElementById('article_title').value.trim();
    const article_content = document.getElementById('article_content').value.trim();
    const error_element_1 = document.getElementById("title_error");
    const error_element_2 = document.getElementById("content_error");

    let username = getCookie('username');

    function showError_1(message) {
        error_element_1.textContent = message;
        error_element_1.style.display = "block";
        error_element_1.style.color = "#e74c3c";
    }

    function showError_2(message) {
        error_element_2.textContent = message;
        error_element_2.style.display = "block";
        error_element_2.style.color = "#e74c3c";
    }

    if (!article_title) {
        showError_1("Article title cannot be empty");
        if (!article_content) {
            showError_2("Article content cannot be empty");
            return;
        }
        return;
    }

    if (!article_content) {
        showError_2("Article content cannot be empty");
        return;
    }

    const tagElements = document.querySelectorAll('.tags-input .tag');
    const tags = Array.from(tagElements).map(tag => {
        return tag.childNodes[0].nodeValue.trim();
    }).filter(tag => tag !== article_title);

    const requestData = {
        "username": username,
        "title": article_title,
        "content": article_content,
        "tags": tags
    };

    fetch(`${url}/create/question`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (response.status != 400) {
                window.location.href = "userhome";
            } else {
                window.location.href = "article";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function createAnswer() {
    let question_title = getCookie('question_title');
    const answer_content = document.getElementById('answer_content').value;
    const error_element = document.getElementById("content_error");
    let username = getCookie('username');

    if (!username) {
        window.location.href = "login"
        return;
    }

    function showError(message) {
        error_element.textContent = message;
        error_element.style.display = "block";
        error_element.style.color = "#e74c3c";
    }

    if (!answer_content) {
        showError("Question title cannot be empty");
        return;
    }

    const requestData = {
        "username": username,
        "question_title": question_title,
        "answer_content": answer_content,
    };

    fetch(`${url}/create/answer`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestData)
    })
        .then(response => {
            if (response.status != 400) {
                window.location.href = "questionwithanswers";
            } else {
                window.location.href = "questionwithanswers";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function openQuestion(question_title) {
    fetch(`${url}/question/detail`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "question_title": question_title,
            "current_username": getCookie('username')
        })
    })
        .then(response => {
            window.location.href = "questionwithanswers";
            document.cookie = `question_title=${question_title}`;
            return response.json()
        })
        .catch(err => console.error(err));
}

function upvote_question() {
    const username = getCookie("username");
    const question_title = getCookie("question_title");

    fetch(`${url}/upvote/question`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username,
            "question_title": question_title,
        })
    })
        .then(response => {
            window.location.href = "questionwithanswers";
            const like_button = document.getElementById("like_button");
            if (response.status == 201) {
                like_button.style.color = "#0084ff";
            } else if (response.status == 200) {
                like_button.style.color = "#8590a6";
            } else {
                window.location.href = "userhome";
            }
            return response.json()
        })
        .catch(err => console.error(err));
}

function upvote_answer(answer_content) {
    const username = getCookie("username")
    fetch(`${url}/upvote/answer`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username,
            "answer_content": answer_content,
        })
    })
        .then(response => {
            window.location.href = "questionwithanswers";
            const like_button = document.getElementById("like_button_answer");
            if (response.status == 201) {
                like_button.style.color = "#0084ff";
            } else if (response.status == 200) {
                like_button.style.color = "#8590a6";
            }
            return response.json()
        })
        .catch(err => console.error(err));

}

function searching() {
    const searching_content = document.getElementById('searching_content').value.trim();
    window.location.href = "searchingResult";
    document.cookie = `searching_content=${searching_content}`;
}

document.addEventListener('DOMContentLoaded',
    function displaySearchingResult() {
        fetch(`${url}/search/all`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "searching_content": getCookie("searching_content"),
            })
        })
            .then(response => response.json())
            .then(data => {
                const search_result_body = document.getElementById("search_result_body");
                search_result_body.innerHTML = "";
                let i = 0;
                if (Object.entries(data).length == undefined) {
                    const item = `<div class="no-results">
                    <h3>No results found for "${searching_content}"</h3>
                    <p>Try different keywords or check out popular topics.</p>
                </div>`;
                    search_result_body.innerHTML += item;
                } else {
                    for (const [_, [type, user_displayed_name, question_title, r, upvotes, timestamp]] of Object.entries(data)) {
                        let item;
                        if (type == "question") {
                            item = `<div class="result-card">
                    <div class="result-type">Question</div>
                    <h2 class="result-title">
                        <a onclick="openQuestion('${question_title}')">${question_title}</a>
                    </h2>
                    <div class="result-meta">
                        <span class="result-author">PhilosophyStudent</span>
                        <div class="result-stats">
                            <span class="result-stat">${upvotes} approval</span>
                            <span class="result-stat">${r} answers</span>
                            <span class="result-stat">${timestamp}</span>
                        </div>
                    </div>
                </div>`;
                        } else {
                            item = `<div class="result-card">
                    <div class="result-type">Answer to:</div>
                    <h3 class="related-question">
                        <a onclick="openQuestion('${question_title}')">${question_title}</a>
                    </h3>
                    <div class="answer-excerpt">
                        <div class="answer-header">
                            <span class="answer-author">${user_displayed_name}</span>
                            <span class="answer-date">${timestamp}</span>
                        </div>
                        <div class="answer-content">${r}</div>
                        <div class="answer-stats">
                            <span class="answer-stat">${upvotes} approval</span>
                        </div>
                    </div>
                </div>`;
                        }
                        i++;
                        search_result_body.innerHTML += item;
                    }

                }
                const num_of_result = document.getElementById("num_of_result");
                num_of_result.innerHTML = `${i} results found`;
            })
            .catch(err => console.error(err));
    });

function handleTagInput() {
    if (event.key === 'Enter' || event.key === ',' || event.type === 'blur') {
        event.preventDefault();
        const tagInput = event.target;
        const tagValue = tagInput.value.trim();
        const questionTitle = document.getElementById('question_title').value.trim();

        if (tagValue && tagValue !== questionTitle) {
            addTag(tagValue);
            tagInput.value = '';
        }
    }
}

function addTag(tagName) {
    const tagsInput = document.querySelector('.tags-input');

    const existingTags = Array.from(document.querySelectorAll('.tags-input .tag'))
        .map(tag => tag.childNodes[0].nodeValue.trim());

    if (existingTags.includes(tagName)) {
        return;
    }

    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
        ${tagName} <span class="tag-remove" onclick="removeTag(this)">×</span>
    `;
    tagsInput.appendChild(tagElement);
}

function removeTag(removeButton) {
    removeButton.parentElement.remove();
}

function initTagHandling() {
    const tagInput = document.querySelector('.form-group .form-input');

    tagInput.addEventListener('keydown', handleTagInput);
    tagInput.addEventListener('blur', handleTagInput);

    document.querySelectorAll('.tag-remove').forEach(button => {
        button.addEventListener('click', function () {
            removeTag(this);
        });
    });
}

document.addEventListener('DOMContentLoaded', initTagHandling);

function logout() {
    document.cookie = `username=; login=; question_title=`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}

function backToHome() {
    let username = getCookie('username')
    if (!username) {
        window.location.href = "index";
    } else {
        window.location.href = "userhome";
    }
}
