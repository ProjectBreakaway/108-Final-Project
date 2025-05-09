const url = "http://127.0.0.1:5000";

function logIn() {
    let username_login = document.getElementById("username_login").value;
    let password_login = document.getElementById("password_login").value;
    fetch(`${url}/signin/me`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username_login,
            "password": password_login,
            })
        })
        .then(response => {
            if (response.status != 400) {
                document.cookie = `username=${username_login}; login=${true}`;
                window.location.href = "userhome";
            } else {
                window.location.href = "signup";
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

    fetch(`${url}/questions/me`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username,
            })
        })
        .then(response => response.json())
        .then(data => {
            const questions_body = document.getElementById('questions_body')
            questions_body.innerHTML = '';
            for (const [title, [content, total_answers, timestamp, upvotes]] of Object.entries(data)) {
                const item = `<li class="question-item">
                    <h3 class="question-title"><a href="#">${title}</a></h3>
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
});

document.addEventListener('DOMContentLoaded',
    function displayAnswers() {
    let username = getCookie('username');

    fetch(`${url}/answers/me`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username,
            })
        })
        .then(response => response.json())
        .then(data => {
            const answers_body = document.getElementById('answers_body')
            answers_body.innerHTML = '';
            for (const [question_title, [content, timestamp, upvotes]] of Object.entries(data)) {
                const item = `<li class="answer-item">
                    <p class="answer-question">In response to: <a href="#">"${question_title}"</a></p>
                    <div class="answer-content">
                        <p>${content}</p>
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
});

function change_user_settings() {
    const displayed_name = document.getElementById('displayed_name_in_settings').value;
    const email =document.getElementById('email_in_settings').value;
    const description =document.getElementById('description_in_settings').value;
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
        button.addEventListener('click', function() {
            removeTag(this);
        });
    });
}

document.addEventListener('DOMContentLoaded', initTagHandling);

function logout() {
    document.cookie = `username=; login=`;
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