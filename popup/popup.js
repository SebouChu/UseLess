// Récupère l'URL de l'onglet ouvert et appelle le callback avec l'URL en paramètre
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var url = tab.url;

    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

getCurrentTabUrl((url) => {
  var match = url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
  var domain = match[1];

  var script = 'console.log("'+domain+'");';

  var currentDomainElt = document.querySelector("#current-domain");
  var currentUptimeElt = document.querySelector("#current-uptime");

  currentDomainElt.innerHTML = "Vous êtes actuellement sur le domaine : "+domain;
  chrome.tabs.executeScript({
    code: script
  });
});
