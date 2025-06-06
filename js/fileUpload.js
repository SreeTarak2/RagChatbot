const uploadButton = document.querySelector("#upload_documents");
const fileInput = document.getElementById("file_input");
const chatbox = document.getElementById("chatboxInput");

let fileBox = null;

chatbox.addEventListener("input", () => {
  chatbox.style.height = "auto"; // Reset height
  const maxRows = 6;
  const lineHeight = 24; // Adjust based on your font-size

  const currentScrollHeight = chatbox.scrollHeight;
  const maxHeight = maxRows * lineHeight;

  if (currentScrollHeight > maxHeight) {
    chatbox.style.height = `${maxHeight}px`;
    chatbox.style.overflowY = "scroll";
  } else {
    chatbox.style.height = `${currentScrollHeight}px`;
    chatbox.style.overflowY = "hidden";
  }
});

uploadButton.addEventListener("click", (e) => {
  e.preventDefault();
  fileInput.click(); // Trigger file selection
});

fileInput.addEventListener("change", (event) => {
  // for multiple files
  // Array.from(event.target.files).forEach((file) => {
  //   uploadFileToServer(file, fileBox);
  // })
  const file = event.target.files[0];
  if (file) {
    // Always create a new file box (remove the global fileBox logic)
    const fileBox = document.createElement("div");
    fileBox.classList.add("file-box");

    // Create file header container
    const fileHeader = document.createElement("div");
    fileHeader.classList.add("file-header");

    // File name
    const fileName = document.createElement("span");
    fileName.classList.add("file-name");
    fileName.textContent = file.name;

    // Remove button
    const removeButton = document.createElement("button");
    removeButton.classList.add("file-remove");
    removeButton.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    removeButton.addEventListener("click", () => {
      fileBox.remove();
    });

    // Append name and button to header
    fileHeader.appendChild(fileName);
    fileHeader.appendChild(removeButton);

    // Append header to file box
    fileBox.appendChild(fileHeader);

    // Progress bar
    const progressBar = document.createElement("progress");
    progressBar.classList.add("file-progress");
    progressBar.setAttribute("value", 0);
    progressBar.setAttribute("max", 100);

    // Append progress bar to file box
    fileBox.appendChild(progressBar);

    document.getElementById("file-preview-container").appendChild(fileBox);

    // Upload this specific file box
    uploadFileToServer(file, fileBox);
  }
});

// ✅ Real file upload with progress tracking
function uploadFileToServer(file, fileBox) {
  const progressBar = fileBox.querySelector(".file-progress");
  const formData = new FormData();
  formData.append("file", file);

  const token = sessionStorage.getItem("accessToken");
  
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "https://plenty-roommate-owners-dispatched.trycloudflare.com/upload/", true);
  xhr.withCredentials = true;
  // Set the Authorization header
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      progressBar.value = percentComplete;
    }
  };

  xhr.onload = function () {
    const errorBox = document.getElementById("upload-error");
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      console.log("✅ File uploaded:", response.message);
      errorBox.style.display = "none";
    } else {
      errorBox.textContent = `❌ Upload failed with status ${xhr.status}`;
      errorBox.style.display = "block";
      setTimeout(() => {
        errorBox.style.display = "none";
      }, 5000);
    }
  };

  xhr.onerror = function () {
    const errorBox = document.getElementById("upload-error");
    errorBox.textContent = "❌ Upload error occurred.";
    errorBox.style.display = "block";
    setTimeout(() => {
      errorBox.style.display = "none";
    }, 5000);
  };

  xhr.send(formData);
}
