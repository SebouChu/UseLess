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
  openExtensionPage();
  initOneTimeAchievements();
  initUptimeAchievements();
  showStorage();
});

// Initialise les OneTimeAchievements dans le Chrome Storage
function initOneTimeAchievements() {
  var oneTimeAchievementsByWebsite = {};
  getJSON("achievements/onetime.json").then(function(json) {
    for (var i = 0 ; i < json.length ; i++) {

      // Remplit l'objet faisant correspondre les domaines aux index
      for (var j = 0 ; j < json[i]["website"].length ; j++) {
        if(oneTimeAchievementsByWebsite[json[i]["website"][j]] === undefined) {
          oneTimeAchievementsByWebsite[json[i]["website"][j]] = [i];
        } else {
          oneTimeAchievementsByWebsite[json[i]["website"][j]].push(i);
        }
      }

    }
    chrome.storage.sync.set({"onetimeWebsites": oneTimeAchievementsByWebsite});
  });
}

// Initialise les UptimeAchievements dans le Chrome Storage
function initUptimeAchievements() {
  var uptimeAchievementsByWebsite = {};
  getJSON("achievements/uptime.json").then(function(json) {
    for (var i = 0 ; i < json.length ; i++) {

      // Remplit l'objet faisant correspondre les domaines aux index
      for (var j = 0 ; j < json[i]["website"].length ; j++) {
        if(uptimeAchievementsByWebsite[json[i]["website"][j]] === undefined) {
          uptimeAchievementsByWebsite[json[i]["website"][j]] = [i];
        } else {
          uptimeAchievementsByWebsite[json[i]["website"][j]].push(i);
        }
      }

    }
    chrome.storage.sync.set({"uptimeWebsites": uptimeAchievementsByWebsite});
  });
}



/****************
 * MESSAGE RECU *
 ****************/


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var currentDate = new Date();
  var match = request.url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
  var domain = match[1];

  chrome.storage.sync.get("onetimeWebsites", function(result) {
    // Si le domaine possède un ou des achievements
    if(result["onetimeWebsites"][domain] !== undefined) {
      getJSON("achievements/onetime.json").then(function(json) {
        // On parcourt les achievementsIndex du domaine
        for (var i = 0 ; i < result["onetimeWebsites"][domain].length ; i++) {
          var achievementIndex = result["onetimeWebsites"][domain][i];
          // On récupère l'achievement correspondant dans le JSON
          var achievement = json[achievementIndex];
          checkAchievement(achievement);
        }
      });
    }
  });
});

// Check l'achievement s'il n'est pas déjà obtenu
function checkAchievement(achievement) {
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
  console.log(achievement);
  chrome.notifications.create(options);
}
