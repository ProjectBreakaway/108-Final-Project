const url = "http://127.0.0.1:5000";
let username = '';
let login = false;

function logIn() {
    let username_login = document.getElementById("username_login").value;
    let password_login = document.getElementById("password_login").value;
    fetch(`${url}/${username_login}/${password_login}`)
        .then(response => response.json())
        .then(_ => {
            username = username_login;
            login = true;
            window.location.href = "userhome.html";
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

    fetch(`${url}/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username_signup,
            "password": password_signup,
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            username = username_signup;
            login = true;
            console.log(username);
            window.location.href = "userhome.html";
        })
        .catch(err => console.error(err));
}

function openUserProfile() {
    console.log(username)
    console.log(login)
    fetch(`${url}/profile/${username}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            window.location.href = "profile.html";
            document.getElementById('username').textContent = data.username;
            document.getElementById('description').textContent = data.description;
            document.getElementById('totalQuestions').textContent = data.questions;
            document.getElementById('totalAnswers').textContent = data.answers;
            document.getElementById('totalLike').textContent = data.liked;
        })
    .catch(err => console.error(err));
}

function logout() {
    fetch(`${url}/`)
        .then(response => response.text())
        .then(data => {
            document.open();
            document.write(data);
            document.close();
        })
        .catch(err => console.error(err));
    username = '';
    login = false;
}

function toHome() {
    fetch(`${url}/`)
        .then(response => response.text())
        .then(data => {
            document.open();
            document.write(data);
            document.close();
        })
        .catch(err => console.error(err));
}


function toUserHomePage(){
    fetch(`${url}/userhome`)
        .then(response => response.text())
        .then(data => {
            document.open();
            document.write(data);
            document.close();
        })
        .catch(err => console.error(err));
}

function toLogin() {
    fetch(`${url}/login`)
        .then(response => response.text())
        .then(data => {
            document.open();
            document.write(data);
            document.close();
        })
        .catch(err => console.error(err));
}

function toSignup() {
    fetch(`${url}/signup`)
        .then(response => response.text())
        .then(data => {
            document.open();
            document.write(data);
            document.close();
        })
        .catch(err => console.error(err));
}