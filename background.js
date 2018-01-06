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

/**********************
 * MESSAGE MANAGEMENT *
 **********************/


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  var currentDate = new Date();
  var currentDomain = request.domain;

  // Gestion des OneTimeAchievements
  chrome.storage.sync.get("onetimeDomains", function(result) {
    // Si le domaine possède un OneTimeAchievement
    if(result["onetimeDomains"][currentDomain] !== undefined) {
      var achievementIndex = result["onetimeDomains"][currentDomain];
      getJSON("achievements/onetime.json").then(function(onetimeJSON) {
        // On récupère l'achievement correspondant dans le JSON
        var achievement = onetimeJSON[achievementIndex];
        checkOneTimeAchievement(achievement, currentDate.toLocaleString());
      });
    }
  });

  // Appelle la méthode qui gère l'alarme Chrome pour les UptimeAchievements
  checkCurrentDomain(currentDomain);

});

/***************************
 * SELECTED TAB MANAGEMENT *
 ***************************/

// Quand l'onglet actif change
chrome.tabs.onActivated.addListener(function(activeInfo) {

  console.log(activeInfo);
  // Récupération de l'onglet actif
  let activeTab = chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab.url != "") {
      var currentDomain = tab.url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/)[1];

      // Appelle la méthode qui gère l'alarme Chrome pour les UptimeAchievements
      checkCurrentDomain(currentDomain);
    }
  });

});

/********************
 * ALARM MANAGEMENT *
 ********************/

function checkCurrentDomain(currentDomain) {
  // Gestion de l'alarme des UptimeAchievements
  chrome.storage.sync.get("uptimeDomains", function(resultDomains) {
    var uptimeDomains = resultDomains["uptimeDomains"];
    // On vérifie si le domaine actuel possède un UptimeAchievement
    var domainHasAchievement = uptimeDomains[currentDomain] !== undefined;

    chrome.storage.local.get("alarmDomain", function(resultAlarm) {
      var alarmDomain = resultAlarm["alarmDomain"];
      // Si le domaine a changé
      if (alarmDomain !== currentDomain) {
        // Si les deux domaines n'ont pas le même achievement
        if (uptimeDomains[alarmDomain] !== uptimeDomains[currentDomain]) {
          if (alarmDomain !== undefined) {
            chrome.alarms.clear("uptimeAlarm"); // On supprime l'alarme si elle a été créée
            console.log("Alarm cleared.");
          }
          if (domainHasAchievement) {
            console.log("Domain has an uptimeAchievement");
            // Si le nouveau domaine a un achievement, on met une alarme et on règle l'alarmDomain
            chrome.storage.local.set({"alarmDomain": currentDomain});

            let alarmOptions = {
              delayInMinutes: 1,
              periodInMinutes: 1
            }
            chrome.alarms.create("uptimeAlarm", alarmOptions);
            console.log("Alarm created.");
          } else {
            console.log("Domain hasn't an uptimeAchievement");
            // Sinon on supprime l'alarmDomain
            chrome.storage.local.remove("alarmDomain");
          }
        }
      }
    });
  });
}

// Quand l'alarme sonne
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == "uptimeAlarm") {
    chrome.storage.local.get("alarmDomain", function(resultAlarmDomain) {
      let domain = resultAlarmDomain["alarmDomain"];
      chrome.storage.sync.get("uptimeDomains", function(resultDomains) {
        var achievementIndex = resultDomains["uptimeDomains"][domain];
        getJSON("achievements/uptime.json").then(function(uptimeJSON) {
          // On récupère l'achievement correspondant dans le JSON
          var achievement = uptimeJSON[achievementIndex];
          let currentDate = new Date();
          checkUptimeAchievement(achievement, currentDate.toLocaleString());
        });
      });
    });
  }
});



// Check le OneTimeAchievement s'il n'est pas déjà obtenu
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

// Check le UptimeAchievement par rapport au compteur et au level actuel
function checkUptimeAchievement(achievement, currentDate) {
  let achievementId = achievement["id"];
  chrome.storage.sync.get(achievementId, function(result) {
    var storageData = result[achievementId];
    let currentLevel = storageData["level"];
    var levelUp = false;
    if (currentLevel < achievement["maxLevel"]) {
      storageData["uptimeMinutes"] += 1;
      if (storageData["uptimeMinutes"] == achievement["minutesByLevel"][currentLevel]) {
        storageData["level"] += 1;
        levelUp = true;
        storageData["achievedDate"] = currentDate;
      }
      var data = {};
      data[achievementId] = storageData;
      chrome.storage.sync.set(data);

      // On envoie une notification si levelUp
      if (levelUp) { postUptimeNotification(achievement, storageData); }
    }
  })
}


/*****************
 * NOTIFICATIONS *
 *****************/


chrome.notifications.onClicked.addListener(function(notificationId) {
  openExtensionPage();
  chrome.notifications.clear(notificationId);
});

function postOneTimeNotification(achievement) {
  var notificationOptions = {
    type: "basic",
    title: achievement["name"],
    message: achievement["description"],
    iconUrl: 'logo.png',
    isClickable: true
  }
  chrome.notifications.create(notificationOptions);
}

function postUptimeNotification(achievement, storageData) {
  let notificationTitle = `${achievement["name"]} - Niveau ${storageData["level"]}`;
  let notificationMessage = achievement["descriptionByLevel"][storageData["level"] - 1];
  var notificationOptions = {
    type: "basic",
    title: notificationTitle,
    message: notificationMessage,
    iconUrl: 'logo.png',
    isClickable: true
  }
  chrome.notifications.create(notificationOptions);
}
