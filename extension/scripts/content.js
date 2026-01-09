const ALLOWED = new Set(["chatgpt.com", "chat.openai.com", "claude.ai"]);

function injectSideTab() {
  if (document.getElementById("promptify-root")) return;

  const host = document.createElement("div");
  host.id = "promptify-root";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      .wrapper {
        width: fit-content;
        display: flex;
        align-items: center;
        top: 50%;
        transform: translateY(-50%);
        right: 0;
        position: absolute;
        z-index: 99;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      .tab {
        width: 30px;
        height: 30px;
        background-color: #4cc0e6;
        color: white;
        border-radius: 20px 0 0 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .panel {
        display: none;
      }
      .panel.open {
        display: flex;
        padding: 20px;
        width: 250px;
        height: fit-content;
        min-height: fit-content;
        max-height: 300px;
        background: white;
        color: black;
        border-radius: 10px 0 0 10px;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        textarea {
          width: 100%;
          resize: vertical;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          border: 1.5px solid #4cc0e6;
          border-radius: 8px;
          background: white;
          color: black;
        }

        #pf-enhance {
          width: 100%;
          background: #4cc0e6;
          background: radial-gradient(
            circle,
          rgba(76, 192, 230, 1) 0%,
          rgba(30, 113, 176, 1) 100%
          );
          color: white;
          border-radius: 8px;
          padding: 10px 16px;
          margin-block: 10px;
          border: none;
          transition: all 0.3s;
          cursor: pointer;

          &:hover {
            scale: 1.025;
            box-shadow: #4cc0e6 5px 5px 5px;
            transition: all 0.3s;
          }     
        }
      }
    </style>
    <div class="wrapper">
      <div class="tab">PF</div>
      <div class="panel">
        <button id="pf-enhance">Enhance & Replace</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(host);

  const tab = shadow.querySelector(".tab");
  const panel = shadow.querySelector(".panel");
  if (!tab || !panel) return;
  tab.addEventListener("click", () => panel.classList.toggle("open"));

  const enhanceButton = shadow.querySelector("#pf-enhance");
  if (!enhanceButton) return;
  enhanceButton.addEventListener("click", () => {
    const input = getActiveInput();
    console.log(input.children[0].innerText);
    if (!input) return;
    const text = input.children[0].innerText;
    chrome.runtime.sendMessage(
      { type: "ENHANCE_TEXT", text: text },
      (response) =>
        (input.children[0].innerText = response.data.choices[0].message.content)
    );
  });
}

injectSideTab();

function getActiveInput() {
  return document.querySelector('#prompt-textarea') || document.querySelector('[contenteditable="true"]');
}

function readInput(input) {
  if (input.tagName === "TEXTAREA" || input.tagName === "INPUT")
    return input.value;
  return "";
}
