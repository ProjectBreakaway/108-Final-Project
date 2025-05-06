const url = "http://127.0.0.1:5000";
let username = '';

function logIn() {
    let username_login = document.getElementById("username_login").value;
    let password_login = document.getElementById("password_login").value;
    fetch(`${url}/${username_login}/${password_login}`)
        .then(response => response.json())
        .then(_ => {
            // change_corner();
            username = username_login;
            redirectToHomePage();
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
    console.log('correct before fetch')
    fetch(`${url}/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            "username": username_signup,
            "password": password_signup,
            })
        })
        .then(response => response.json())
        .then(_ => {
            // change_corner();
            username = username_signup;
            redirectToHomePage();
        })
        .catch(err => console.error(err));
}

function change_corner(){
    const corner = document.getElementById("rightTopCorner");
    corner.innerHTML = `
        <style>
            #rightTopCorner .profile-btn {
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            #rightTopCorner .profile-btn:hover .profile-pic {
                transform: scale(1.05);
                box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.3);
            }
            
            #rightTopCorner .profile-pic {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: #0084ff;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                transition: all 0.2s ease;
            }
        </style>
        <button class="profile-btn" onclick="window.location.href='profile.html'">
            <div class="profile-pic">Ph</div>
        </button>`;
}

function redirectToHomePage() {
    window.location.href = "index.html";
}