const input = document.querySelector("#chatboxInput");
const sendButton = document.querySelector(".send-button");
const responseContainer = document.querySelector(".responsecontainer");

const API_URL = "https://norfolk-bathroom-formation-exceed.trycloudflare.com//query";

sendButton.addEventListener("click", async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    const questionElement = document.createElement("div");
    questionElement.classList.add("question", "active");
    questionElement.textContent = userMessage;

    const responseElement = document.createElement("div");
    responseElement.classList.add("response", "active", "typing-dots");  // Add typing animation class
    responseElement.textContent = "Typing";

    responseContainer.appendChild(questionElement);
    responseContainer.appendChild(responseElement);

    input.value = "";

    try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ question: userMessage })
        });

        if (!res.ok) {
            throw new Error(`Server error: ${res.statusText}`);
        }

        const data = await res.json();

        // Remove typing animation class
        responseElement.classList.remove("typing-dots");
        responseElement.textContent = data.answer || "No answer found.";

        if (data.source_documents && data.source_documents.length > 0) {
            const sources = document.createElement("div");
            sources.classList.add("source-docs", "active");
            sources.innerHTML = "<strong>Sources:</strong><br>" +
                data.source_documents
                    .map(doc => `- ${doc.page_content || doc.content || 'No content'}`)
                    .join("<br>");
            responseContainer.appendChild(sources);
        }

        responseContainer.scrollTop = responseContainer.scrollHeight;
    } catch (error) {
        responseElement.classList.remove("typing-dots");
        responseElement.textContent = "Sorry, there was an error processing your request.";
        console.error("Error fetching AI response:", error);
    }
});

// Support sending message on Enter key (without Shift)
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendButton.click();
    }
});
