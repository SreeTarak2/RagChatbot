  const toggleLink = document.getElementById("toggle-link");
  const formTitle = document.getElementById("form-title");
  const nameGroup = document.getElementById("name-group");
  let isSignup = false;


  toggleLink.addEventListener("click", () => {
    isSignup = !isSignup;
    formTitle.textContent = isSignup ? "Signup" : "Login";
    toggleLink.textContent = isSignup ? "Login" : "Signup";
    nameGroup.classList.toggle("hidden");
    document.querySelector(".toggle-text").innerHTML = isSignup
      ? 'Already have an account? <a href="#" id="toggle-link">Login</a>'
      : 'Don\'t have an account? <a href="#" id="toggle-link">Signup</a>';
    // Rebind toggle
    document.getElementById("toggle-link").addEventListener("click", () => location.reload());
  });

