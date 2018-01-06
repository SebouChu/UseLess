var dataInterval = setInterval(sendData, 1000);

// Fonction récupérant les données (URL, Domaine, HTML) et les envoie au script background via le système de messages Chrome
function sendData() {
  let tabDomain = window.location.href.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/)[1];
  let data = {
    domain: tabDomain
  };

  chrome.runtime.sendMessage(data);
  clearInterval(dataInterval);
}
