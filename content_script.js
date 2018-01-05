var dataInterval = setInterval(sendData, 1000);

// Fonction récupérant les données (URL, Domaine, HTML) et les envoie au script background via le système de messages Chrome
function sendData() {
  let tabURL = window.location.href;
  let tabHTML = document.body.innerHTML;

  let data = {
    url: tabURL,
    html: tabHTML
  };

  chrome.runtime.sendMessage(data);
  clearInterval(dataInterval);
}
