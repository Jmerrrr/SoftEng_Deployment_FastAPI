window.onload = function () {
  var sendBtnElem = document.getElementById("sendBtn");
  var clearBtnElem = document.getElementById("clearBtn");
  var chatMessageElem = document.getElementById("chatMessage");
  var chatOutputElem = document.getElementById("chatOutput");
  var loadingContainerElem = document.getElementById("loadingContainer");
  var headings = document.querySelectorAll("h2");

  function clearChat() {
    // Loop through each h2 element
    headings.forEach(function (heading) {
      // Modify the style (e.g., set opacity to 0 for hiding)
      heading.style.opacity = 1;
    });
    var pElement = loadingContainerElem.querySelector("p");
    if (pElement) {
      loadingContainerElem.removeChild(pElement);
      chatOutputElem.removeChild(chatOutputElem.firstChild);
    }
    while (chatOutputElem.firstChild) {
      chatOutputElem.removeChild(chatOutputElem.firstChild);
    }

    // Make a GET request to the FastAPI endpoint
    fetch("/clearMem")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // You can handle the response here if needed
      })
      .catch((error) =>
        console.error("There was a problem with the fetch operation:", error),
      );
  }

  function messageHandler() {
    var message = chatMessageElem.value;
    if (message != null && message != "") {
      // Loop through each h2 element
      headings.forEach(function (heading) {
        // Modify the style (e.g., set opacity to 0 for hiding)
        heading.style.opacity = 0;
      });
      generateUserChatBubble(message);
      loadingContainerElem.classList.remove("d-none");
      sendChatGPTMessage(message, generateAIChatBubble);
      chatMessageElem.value = "";
    } else {
      alert("Please enter a message.");
    }
  }
  chatMessageElem.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      messageHandler();
    }
  });

  sendBtnElem.addEventListener("click", function () {
    messageHandler();
  });

  function generateUserChatBubble(message) {
    // Create a new chat bubble wrapper.
    var chatBubbleElem = document.createElement("div");
    chatBubbleElem.classList.add("container");
    chatBubbleElem.classList.add("user-container");
    // Create the message container.
    var chatMessageElem = document.createElement("p");
    chatMessageElem.innerHTML = message;
    chatBubbleElem.appendChild(chatMessageElem);
    // chatOutputElem.prepend(chatBubbleElem);
    chatOutputElem.appendChild(chatBubbleElem);
    window.scrollTo(0, document.body.scrollHeight);
  }

  function generateAIChatBubble(message) {
    // Create a new chat bubble wrapper.
    var chatBubbleElem = document.createElement("div");
    chatBubbleElem.classList.add("container");
    chatBubbleElem.classList.add("darker");
    // Create the message container.
    var chatMessageElem = document.createElement("p");
    chatMessageElem.innerHTML = message;
    chatBubbleElem.appendChild(chatMessageElem);
    // chatOutputElem.prepend(chatBubbleElem);
    chatOutputElem.appendChild(chatBubbleElem);
    loadingContainerElem.classList.add("d-none");
    window.scrollTo(0, document.body.scrollHeight);
  }
  function sendChatGPTMessage(message, onSuccessCallback) {
    const currentURL = window.location.href;
    const apiUrl = `${currentURL}/lamini`;
    var question = message;
    const encodeQuestion = encodeURIComponent(question);
    const urlWithQuery = apiUrl + "?question=" + encodeQuestion;
    return fetch(urlWithQuery, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        onSuccessCallback(data);
      })
      .catch((error) => {
        console.error("Error: ", error);
      });
  }

  clearBtnElem.addEventListener("click", function () {
    clearChat();
  });

  chatMessageElem.oninput = function () {
    // Reset the height to auto to ensure it shrinks when removing text
    chatMessageElem.style.height = "";

    // Set the height to the scroll height of the content, plus a little extra
    chatMessageElem.style.height =
      Math.min(chatMessageElem.scrollHeight, 100) + "px";
  };
};
