const enhanceButton = document.getElementById('enhance-button');
const input = document.getElementById('input');
const output = document.getElementById('output');

enhanceButton.addEventListener('click', () => {
  if(!input.value) return;
  chrome.runtime.sendMessage(
    {type: "ENHANCE_TEXT", text: input.value},
    (response) => output.innerText = response.data.choices[0].message.content
  );
})