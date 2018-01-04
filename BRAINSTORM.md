# Brainstorm

## Types d'achievements

- OneTimeAchievement
- UptimeAchievement
- CounterAchievement (*coming soon*)

## Détails

### OneTimeAchievement :

Achievement unique validé avec une simple condition.

>Objet exemple :
>``` javascript
>{
>	"id": "objectiveId",
>	"name": "nomObjectif",
>	"description": "descriptionObjectif",
>	"website": ["facebook.com", "www.facebook.com"]
>}
>```

Si une condition est vérifiée, assigne "true" à l'id correspondant dans le chromeStorage.


### UptimeAchievement :

Achievement à paliers validés selon le temps passé sur un site (tableau de domaines)

>Objet exemple :
>``` javascript
>{
>	"id": "objectiveId",
>	"name": "nomObjectif",
>	"descriptionByLevel": ["Novice", "Intermédiaire", "Aficionado", "Virtuose", "Maître du social"],
>	"website": ["facebook.com", "www.facebook.com"],
>	"minutesByLevel": [60, 120, 240, 720, 1440],
>	"maxLevel": 5
>}
>```

Dans le chromeStorage, on a un attribut "objectiveId" et un attribut "objectiveId_uptime"

Toutes les secondes :
- On ajoute 1 à "objectiveId_uptime"
- Si maxLevel != level dans le chromeStorage :
	- On compare l'uptime au prochain palier, s'il est égal, on incrémente l'attribut "objectiveId"

### CounterAchievement (*coming soon*) :

Achievement à paliers validés selon le nombre de pages visités sur un site (tableau de domaines)

>Objet exemple :
>``` javascript
>{
>	"id": "objectiveId",
>	"name": "nomObjectif",
>	"descriptionByLevel": ["Novice", "Intermédiaire", "Aficionado", "Virtuose", "Maître du social"],
>	"website": ["facebook.com", "www.facebook.com"],
>	"countByLevel": [1, 10, 100, 1000, 10000],
>	"maxLevel": 5
>}
>```

Dans le chromeStorage, on a un attribut "objectiveId" et un attribut "objectiveId_count"

A chaque changement de page :
- On ajoute 1 à "objectiveId_count"
- Si maxLevel != level dans le chromeStorage :
	- On compare le count au prochain palier, s'il est égal, on incrémente l'attribut "objectiveId"
