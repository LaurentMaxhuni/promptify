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

        .custom-select {
          position: relative;
          width: 100%;
        }

        .custom-select select {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 5px 10px;
          background-color: #FFFFFF;
          border: 2px solid #5CA2F6;
          border-radius: 8px;
          color: #000000 !important;
          cursor: pointer;
          outline: none;
          box-shadow: 3px 3px 2px 0px #E2E2E2;
        }

        .custom-select select option {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-select select:focus {
          background: #F2F2F2;
          border: 2px solid #5A7EC7;
          border-radius: 8px;
        }

        .custom-select::after {
          content: "";
          position: absolute;
          pointer-events: none;
          top: 50%;
          right: 10px;
          transform: translate(0, -50%);
          width: 12px;
          height: 12px;
          background-color: #000000;
          clip-path: polygon(50% 80%, 0 20%, 100% 20%);
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
        <div class="custom-select">
          <select id="framework-select">
            <option disabled>Select Framework</option>
            <option value="CREO">CREO - Creative Refinement Engine Output</option>
            <option value="RACE">RACE - Reasoned Analytical Completion Engine</option>
            <option value="CARE">CARE - Contextual Analytical Recommendation Engine</option>
            <option value="APE">APE - Analysis Proposal Execution</option>
            <option value="RISE">RISE - Recognition Interpretation Strategic Explanation</option>
            <option value="TAG">TAG - Think Act Guide</option>
            <option value="COAST">COAST - Clarify Organize Apply Summarize Test</option>
            <option value="CREATE">CREATE — Collect Reason Execute Adjust Track Evaluate</option>
          </select>
          <div class="select-arrow"></div>
        </div>
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
    if (!input) return;

    const text = readInputText(input);
    if (!text || !text.trim()) return;

    const framework = shadow.getElementById("framework-select");
    const frameworkValue = framework ? framework.value : "";
    chrome.runtime.sendMessage(
      { type: "ENHANCE_TEXT", text, framework: frameworkValue },
      (response) => {
        if (!response || !response.ok) return;
        const enhanced = response.data?.choices?.[0]?.message?.content;
        if (!enhanced) return;
        writeInputText(input, enhanced);
      }
    );
  });
}

injectSideTab();

function getActiveInput() {
  return (
    document.querySelector("#prompt-textarea") ||
    document.querySelector('textarea') ||
    document.querySelector('[contenteditable="true"]')
  );
}

function readInputText(target) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }
  if (target.isContentEditable) {
    return target.textContent || "";
  }
  return "";
}

function writeInputText(target, value) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const proto =
      target instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (valueSetter) {
      valueSetter.call(target, value);
    } else {
      target.value = value;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (target.isContentEditable) {
    target.textContent = value;
    target.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
}
