window.onload = function () {
  var sendBtnElem = document.getElementById("sendBtn");
  var clearBtnElem = document.getElementById("clearBtn");
  var chatMessageElem = document.getElementById("chatMessage");
  var chatOutputElem = document.getElementById("chatOutput");
  var loadingContainerElem = document.getElementById("loadingContainer");
  var logoElem = document.getElementById("logo");
  var quoteElem = document.getElementById("quote");
  var faqHeadElem = document.getElementById("faqHead");
  var headings = document.querySelectorAll('[id="hero-faq"]');
  var containers = document.querySelectorAll('[id="faq"]');

  let restriesAvailable = 10;
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  containers.forEach(function (container) {
    container.addEventListener("click", function () {
      var faqText = this.querySelector("h3").textContent;
      faqHandler(faqText);
    });
  });

  function clearChat() {
    headings.forEach(function (heading) {
      // Modify the style (e.g., set opacity to 0 for hiding)
      heading.style.opacity = 1;
      heading.style.pointerEvents = "visible";
      heading.style.top = "";
      heading.style.height = "";
    });
    logoElem.style.opacity = 1;
    quoteElem.style.opacity = 1;
    faqHeadElem.style.opacity = 1;
    faqHeadElem.style.pointerEvents = "visible";
    logoElem.style.pointerEvents = "visible";
    quoteElem.style.pointerEvents = "visible";

    restriesAvailable = 10;

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

  function faqHandler(faqMessage) {
    // Loop through each h2 element
    headings.forEach(function (heading) {
      // Modify the style (e.g., set opacity to 0 for hiding)
      heading.style.opacity = 0;
      heading.style.pointerEvents = "none";
      heading.style.top = "1vh";
      heading.style.height = "10vh";
    });
    logoElem.style.opacity = 0;
    quoteElem.style.opacity = 0;
    faqHeadElem.style.opacity = 0;
    logoElem.style.pointerEvents = "none";
    quoteElem.style.pointerEvents = "none";
    faqHeadElem.style.pointerEvents = "none";

    generateUserChatBubble(faqMessage);
    loadingContainerElem.classList.remove("d-none");
    sendChatGPTMessage(faqMessage, generateAIChatBubble);
    chatMessageElem.value = "";
  }

  function messageHandler() {
    // var message = chatMessageElem.value;
    var userInput = chatMessageElem.value;
    var message = userInput[0].toUpperCase() + userInput.slice(1);
    if (message != null && message != "") {
      headings.forEach(function (heading) {
        heading.style.opacity = 0;
        heading.style.pointerEvents = "none";
        heading.style.top = "1vh";
        heading.style.height = "10vh";
      });
      logoElem.style.opacity = 0;
      quoteElem.style.opacity = 0;
      faqHeadElem.style.opacity = 0;
      logoElem.style.pointerEvents = "none";
      quoteElem.style.pointerEvents = "none";
      faqHeadElem.style.pointerEvents = "none";

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
  async function sendChatGPTMessage(message, onSuccessCallback) {
    const hostIp = window.location.hostname;
    const protocol = window.location.protocol;
    const apiUrl = `${protocol}//${hostIp}:8000/lamini`;
    var question = message;
    const encodeQuestion = encodeURIComponent(question);
    const urlWithQuery = apiUrl + "?question=" + encodeQuestion;
    try {
      const response = await fetch(urlWithQuery, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        onSuccessCallback(data);
      } else {
        if (retries > 0) {
          sleep(20000);
          console.log("Sleep");
          sendChatGPTMessage(message, onSuccessCallback, --retries);
        } else {
          onSuccessCallback(
            "Hey, sorry about this, but there's a server error messing with my ability to tackle your current query. Could you shoot your question my way again?",
          );
        }
        console.error("Error: ", response.status);
      }
    } catch (error) {
      onSuccessCallback(
        "Hey, sorry about this, but there's a server error messing with my ability to tackle your current query. Could you shoot your question my way again?",
      );
      console.error("Error: ", response.status);
    }
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
