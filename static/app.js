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
                    console.log(username)

    fetch(`${url}/profile/${username}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('username').innerHTML = data.username;
            document.getElementById('description').innerHTML = data.description;
            document.getElementById('totalQuestions').innerHTML = data.questions;
            document.getElementById('totalAnswers').innerHTML = data.answers;
            document.getElementById('totalLike').innerHTML = data.liked;
        })
        .catch(err => console.error(err));
});

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