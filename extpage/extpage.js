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
    <p><strong>__name____achieved-subtitle__</strong></p>
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
      onetimeElt = onetimeElt.replace(/__achieved-subtitle__/, "");
    } else {
      onetimeElt = onetimeElt.replace(/__achieved__/, "achieved");
      var formattedDate = result[achievement["id"]]["date"]
      onetimeElt = onetimeElt.replace(/__achieved-subtitle__/, " <em>(obtenu le "+formattedDate+")</em>");
    }
    onetimeAchievements += onetimeElt;
    if (isLast) {
      onetimeAchievementsElt.innerHTML = onetimeAchievements;
    }
  });
}

var uptimeAchievementsElt = document.querySelector("#uptime-achievements");
var uptimeAchievements = "";
let uptimeProto = `<div class="uptime-achievement __achieved__">
  <div class="icon-container">
    <img class="level-__level__" src="__img-link__" alt="__name__">
  </div>
  <div class="text-container">
    <p><strong>__name____achieved-subtitle__</strong></p>
    <p>__description__</p>
  </div>
</div>`;

getJSON("../achievements/uptime.json").then(function(json) {
  for (var i = 0 ; i < json.length ; i++) {
    if (i == json.length - 1) {
      generateUptimeElt(json[i], true);
    } else {
      generateUptimeElt(json[i]);
    }
  }
});

function generateUptimeElt(achievement, isLast = false) {
  var uptimeElt = uptimeProto;
  uptimeElt = uptimeElt.replace(/__name__/g, achievement["name"]);
  chrome.storage.sync.get(achievement["id"], function(result) {
    let storageData = result[achievement["id"]];
    let descriptionIndex = Math.max(1, storageData["level"]) - 1;
    uptimeElt = uptimeElt.replace(/__description__/, achievement["descriptionByLevel"][descriptionIndex]);

    if(achievement["icon"] !== undefined) {
      uptimeElt = uptimeElt.replace(/__img-link__/, "../"+achievement["icon"]);
    } else {
      uptimeElt = uptimeElt.replace(/__img-link__/, "../logo.png");
    }
    if(storageData["achievedDate"] === undefined) {
      uptimeElt = uptimeElt.replace(/__achieved__/, "");
      uptimeElt = uptimeElt.replace(/__achieved-subtitle__/, "");
    } else {
      uptimeElt = uptimeElt.replace(/__achieved__/, "achieved");
      var formattedDate = storageData["achievedDate"]
      uptimeElt = uptimeElt.replace(/__achieved-subtitle__/, " <em>(niveau "+storageData["level"]+" obtenu le "+formattedDate+")</em>");
    }

    uptimeAchievements += uptimeElt;
    if (isLast) {
      uptimeAchievementsElt.innerHTML = uptimeAchievements;
    }
  });
}
