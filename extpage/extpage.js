chrome.storage.onChanged.addListener(function() {
  document.location.reload();
});

// Récupère le contenu d'un JSON en AJAX
function getJSON(url) {
  return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', chrome.extension.getURL(url), true);
      xhr.responseType = 'json';
      xhr.onload = function() {
          if (xhr.status == 200) {
              resolve(xhr.response);
          } else {
              reject(xhr.status);
          }
      };
      xhr.send();
  });
}

var onetimeAchievementsElt = document.querySelector("#onetime-achievements");
var onetimeAchievements = "";
let onetimeProto = `<div class="onetime-achievement __achieved__">
  <div class="icon-container">
    <img src="__img-link__" alt="__name__">
  </div>
  <div class="text-container">
    <p><strong>__name__</strong></p>
    <p>__description__</p>
  </div>
</div>`;

getJSON("../achievements/onetime.json").then(function(json) {
  for (var i = 0 ; i < json.length ; i++) {
    if (i == json.length - 1) {
      generateOnetimeElt(json[i], true);
    } else {
      generateOnetimeElt(json[i]);
    }
  }
});

function generateOnetimeElt(achievement, isLast = false) {
  var onetimeElt = onetimeProto;
  onetimeElt = onetimeElt.replace(/__name__/g, achievement["name"]);
  onetimeElt = onetimeElt.replace(/__description__/, achievement["description"]);
  if(achievement["icon"] !== undefined) {
    onetimeElt = onetimeElt.replace(/__img-link__/, "../"+achievement["icon"]);
  } else {
    onetimeElt = onetimeElt.replace(/__img-link__/, "../logo.png");
  }
  chrome.storage.sync.get(achievement["id"], function(result) {
    if(!result[achievement["id"]]) {
      onetimeElt = onetimeElt.replace(/__achieved__/, "");
    } else {
      onetimeElt = onetimeElt.replace(/__achieved__/, "achieved");
    }
    onetimeAchievements += onetimeElt;
    if (isLast) {
      onetimeAchievementsElt.innerHTML = onetimeAchievements;
    }
  });
}
