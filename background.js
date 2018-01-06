/********
 * CORE *
 ********/

// Print contenu du Storage
function showStorage() {
  chrome.storage.sync.get(null, function(result) {
    console.log(result);
  });
}

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

// Ouvre la page de l'extension
function openExtensionPage() {
  var extPageURL = chrome.extension.getURL("extpage/extpage.html");
  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i = 0; i < extensionTabs.length; i++) {
        if (extPageURL == extensionTabs[i].url) {
            found = true;
            chrome.tabs.update(extensionTabs[i].id, {"active": true});
            break;
        }
    }
    if (!found) {
        chrome.tabs.create({url: "extpage/extpage.html"});
    }
  });
};



/****************
 * INSTALLATION *
 ****************/

chrome.runtime.onInstalled.addListener(function() {
  initStorageData();
});

chrome.browserAction.onClicked.addListener(function() {
  openExtensionPage();
});

function initStorageData() {
  getJSON("achievements/onetime.json").then(function(onetimeJSON) {
    getJSON("achievements/uptime.json").then(function(uptimeJSON) {
      var achievementsByDomain = getAchievementsByDomain(onetimeJSON, uptimeJSON);
      chrome.storage.sync.set(achievementsByDomain, function() {
        console.log("Achievements by Domain: initialized.");
      });
      initUptimeStorageData(uptimeJSON);
    });
  });
}

function getAchievementsByDomain(onetimeJSON, uptimeJSON) {
  var onetimeAchievementsByDomain = {};
  var uptimeAchievementsByDomain = {};

  // On hydrate l'objet onetimeAchievementsByDomain avec onetimeJSON...
  for (var i = 0 ; i < onetimeJSON.length ; i++) {
    for (var j = 0 ; j < onetimeJSON[i]["domains"].length ; j++) {
      onetimeAchievementsByDomain[onetimeJSON[i]["domains"][j]] = i; // ... en faisant correspondre les domaines aux index correspondants
    }
  }

  for (var i = 0 ; i < uptimeJSON.length ; i++) {
    // On hydrate l'objet uptimeAchievementsByDomain avec uptimeJSON...
    for (var j = 0 ; j < uptimeJSON[i]["domains"].length ; j++) {
      uptimeAchievementsByDomain[uptimeJSON[i]["domains"][j]] = i; // ... en faisant correspondre les domaines aux index correspondants
    }
  }

  // On retourne les objets par un objet parent qui sera envoyé au Chrome Storage
  var achievementsByDomain = {
    "onetimeDomains": onetimeAchievementsByDomain,
    "uptimeDomains": uptimeAchievementsByDomain
  }

  return achievementsByDomain;
}

function initUptimeStorageData(uptimeAchievements) {
  var outputData = {};
  uptimeAchievements.forEach(function(achievement, index) {
    chrome.storage.sync.get(achievement["id"], function(result) {
      if (result[achievement["id"]] === undefined) {
        outputData[achievement["id"]] = {
          level: 0,
          uptimeMinutes: 0
        };
      }
      if (index == uptimeAchievements.length - 1) {
        chrome.storage.sync.set(outputData, function() {
          console.log("UptimeAchievements: initialized.");
          showStorage();
        });
      }
    });
  });
}

/****************
 * MESSAGE RECU *
 ****************/


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var currentDate = new Date();
  var currentDomain = request.url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/)[1];

  chrome.storage.sync.get("onetimeDomains", function(result) {
    // Si le domaine possède un ou des achievements
    if(result["onetimeDomains"][currentDomain] !== undefined) {
      var achievementIndex = result["onetimeDomains"][currentDomain];
      getJSON("achievements/onetime.json").then(function(onetimeJSON) {
        // On récupère l'achievement correspondant dans le JSON
        var achievement = onetimeJSON[achievementIndex];
        checkOneTimeAchievement(achievement, currentDate.toLocaleString());
      });
    }
  });
});

// Check l'achievement s'il n'est pas déjà obtenu
function checkOneTimeAchievement(achievement, currentDate) {
  chrome.storage.sync.get(achievement["id"], function(result) {
    // Si l'achievement n'est pas déjà obtenu, on l'active
    if(!result[achievement["id"]]) {
      var dataValue = {
        achieved: true,
        date: currentDate
      };
      var data = {};
      data[achievement["id"]] = dataValue;
      chrome.storage.sync.set(data);
      // On envoie une notification
      postOneTimeNotification(achievement);
    }
  });
}



/*****************
 * NOTIFICATIONS *
 *****************/


chrome.notifications.onClicked.addListener(function(notificationId) {
  openExtensionPage();
  chrome.notifications.clear(notificationId);
});

function postOneTimeNotification(achievement) {
  var options = {
    type: "basic",
    title: achievement["name"],
    message: achievement["description"],
    iconUrl: 'logo.png',
    isClickable: true
  }
  chrome.notifications.create(options);
}
