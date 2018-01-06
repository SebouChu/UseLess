chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName == "sync") {
    document.location.reload();
  }
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

// Récupère le contenu d'un SVG en AJAX
function getSVGElement(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status == 200) {
        var parser = new DOMParser(),
        result = parser.parseFromString(xhr.responseText, 'text/xml'),
        inlinedSVG = result.getElementsByTagName('svg')[0];
        inlinedSVG.removeAttribute('xmlns:a');
        inlinedSVG.removeAttribute('width');
        inlinedSVG.removeAttribute('height');
        inlinedSVG.removeAttribute('x');
        inlinedSVG.removeAttribute('y');
        inlinedSVG.removeAttribute('enable-background');
        inlinedSVG.removeAttribute('xmlns:xlink');
        inlinedSVG.removeAttribute('xml:space');
        inlinedSVG.removeAttribute('version');
        resolve(inlinedSVG);
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
    onetimeElt = onetimeElt.replace(/__img-link__/, "../assets/icons/onetime/"+achievement["icon"]);
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
    let level = storageData["level"];
    let descriptionIndex = Math.max(1, storageData["level"]) - 1;
    uptimeElt = uptimeElt.replace(/__description__/, achievement["descriptionByLevel"][descriptionIndex]);
    uptimeElt = uptimeElt.replace(/__level__/, level);

    if(achievement["icon"] !== undefined) {
      uptimeElt = uptimeElt.replace(/__img-link__/, "../assets/icons/uptime/"+achievement["icon"]);
    } else {
      uptimeElt = uptimeElt.replace(/__img-link__/, "../logo.png");
    }
    if(storageData["achievedDate"] === undefined) {
      uptimeElt = uptimeElt.replace(/__achieved__/, "");
      uptimeElt = uptimeElt.replace(/__achieved-subtitle__/, "");
    } else {
      uptimeElt = uptimeElt.replace(/__achieved__/, "achieved");
      var formattedDate = storageData["achievedDate"]
      uptimeElt = uptimeElt.replace(/__achieved-subtitle__/, " <em>(niveau "+level+" obtenu le "+formattedDate+")</em>");
    }

    uptimeAchievements += uptimeElt;
    if (isLast) {
      uptimeAchievementsElt.innerHTML = uptimeAchievements;
      setInlineSVGs();
    }
  });
}

function setInlineSVGs() {
  var imgElts = document.querySelectorAll("img");
  imgElts.forEach(function(imgItem, index) {
    if (imgItem.src.match(/^(.+)\.svg$/)) {
      getSVGElement(imgItem.src).then(function(svgElt) {
        svgElt.setAttribute("class", imgItem.getAttribute("class"));
        imgItem.parentNode.replaceChild(svgElt, imgItem);
      });
    }
  });
}
