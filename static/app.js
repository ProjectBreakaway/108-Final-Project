const url = "http://127.0.0.1:5000";
const allCookies = document.cookie;

function logIn() {
    let username_login = document.getElementById("username_login").value;
    let password_login = document.getElementById("password_login").value;
    fetch(`${url}`, {
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
                window.location.href = "login";
            }
            return response.json()
        }
        )
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

    fetch(`${url}/create`, {
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
            document.getElementById('username').innerHTML = ('(username:    ' + data.username + ')');
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