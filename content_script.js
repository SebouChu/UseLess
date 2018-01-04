var dataInterval = setInterval(sendData, 1000);

// Fonction récupérant les données (URL, Domaine, HTML) et les envoie au script background via le système de messages Chrome
function sendData() {
  let tabURL = window.location.href;
  let tabDomain = window.location.host;
  let tabHTML = document.body.innerHTML;

  let data = {
    url: tabURL,
    domain: tabDomain,
    html: tabHTML
  };

  chrome.runtime.sendMessage(data);
  clearInterval(dataInterval);
}
