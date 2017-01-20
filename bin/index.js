var Themeparks = require("themeparks"),
fs = require('fs'),
promise = require('promise'),
Telegraf = require('telegraf'),
reply = require('telegraf').reply,
Markup = require('telegraf').Markup,
Extra = require('telegraf').Extra,
memorySession = require('telegraf').memorySession;

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(memorySession())

var cmdArray = ['/help', '/park', '/fav'];

bot.use((ctx, next) => {
	let cmd = ctx.message.text.split(' ')[0];
	if (in_array(cmd, cmdArray)){
		return next();
	} else {
		return usage(ctx);
	}

})


bot.command('help', (ctx) => {
	return usage(ctx);
})

bot.command('park', (ctx) => {
	requestAPI(ctx).then(function(data){ return data; },function(error){ return error; });
	
})
bot.command('fav', (ctx) => {
	var data = ctx.message.text.split(' ');
	if (data.length >= 2){
		if(data[1] == 'del') return delFavorite(ctx, data);
		else if(data[1] == 'add') return addFavorite(ctx, data);
		else if (data[1] == 'list') return listFavorite(ctx, data);
		else return usage(ctx);
	} else {
		return ctx.reply("**** Favoris ****\n"+
		"/fav list\n"+
		"/fav <add/del> <NomDuParc>\n"+
		"Exemple : /fav add AsterixPark" 
		, Markup.keyboard(['/fav list','/fav add','/fav del']).oneTime().resize().extra());
	}
})

var usage = function(ctx){
	return ctx.reply("Utilisation :\n"+
	"**** Requete ****\n"+
	"/parc\n"+
	"/parc <NomDuParc>\n"+
	"Exemple : /parc AsterixPark\n" +
	"**** Favoris ****\n"+
	"/fav list\n"+
	"/fav <add/del> <NomDuParc>\n"+
	"Exemple : /fav add AsterixPark\n" +
	"/help pour l'aide" 
	, Markup.keyboard(['/park']).oneTime().resize().extra());
}


var requestAPI = function(ctx, typeLine){
	return new Promise(		
		function(resolve, reject){
			try {
				var text = ctx.message.text;
				var data = text.split(' ');
				if (data.length == 1) {
					resolve(ctx.reply('Parcs ', Markup.keyboard(parkArray).oneTime().resize().extra()));
				}
				if(data.length >= 2){
					// access a specific park
					var found = false
					for (park in Themeparks.Parks){
						if (data[1] == park){
							found = true;
							var parc = new Themeparks.Parks[park]();
							parc.GetWaitTimes().then(function(rides) {
								var strWait = []
								for(var i=0, ride; ride=rides[i++];) {
									strWait.push(ride.name + ": " + ride.waitTime + " minutes wait")
								}
								resolve(ctx.reply(strWait.join('\n')));

							}, console.error);
						} 
					}
					if (!found){
						resolve(ctx.reply("Ce park n'est pas disponible"));
					} else {
						return;
					}
				}
			} catch (e){
				console.log(e.message);
				reject(usage(ctx));
			}
		}
	)
}


var addFavorite = function(ctx, data){
	var userId = ctx.message.chat.id
	var text = ctx.message.text;
	if(data.length == 3){
		try {	
			//test if park exists
			if (in_array('/park ' + park, parkArray)){
				var cache = load();
				if (cache == null) {
					cache = [];
				}
				var obj = {
					'userid' : userId ,
					'type' : 'fav',
					'park' : data[2]
				}
				cache.push(obj)
				save(cache)
				return ctx.reply('La commande a bien été prise en compte.')
			}
		} catch(e){
			console.log(e.message);
			return ctx.message("Une erreur est survenue");
		}
	} else {
		return usage(ctx);
	}
}


var listFavorite = function(ctx, data){	
	userId = ctx.message.chat.id
	try {
		cache = load()
		if (cache != null){
			arr = [];
			cache.forEach(function(item){
				if (item.userid == userId && item.type == "fav"){
					arr.push('/park '+ item.park);
				}
				
			});
			if(arr.length > 0){
				return ctx.reply("Liste des favoris", Markup.keyboard(arr).oneTime().resize().extra());
			} else {
				return ctx.reply('Il n\'y a pas de favoris');
			}
		}
	} catch(e){
		console.log(e.message);
		return ctx.message("Une erreur est survenue");
	}
}

var delFavorite = function(ctx, data){
	userId = ctx.message.chat.id
	if(data.length == 3){
		var typeLine = data[2];
		try {
			var cache = load()
			var changes = false;
			if (cache != null){
				cache.forEach(function(item, index){
					console.log(item.park)
					if (item.userid == userId && item.park == data[2] && item.type == 'fav'){
						cache = array_remove(cache, index);
						changes = true;
					}
				});
				save(cache);
				if (changes)
					return ctx.reply('Opération effectuée avec succès.');
				else 
					return ctx.reply('Aucune modification n\'a été effectuée.');
			}
			
		} catch(e){
			console.log(e.message);
			return ctx.message("Une erreur est survenue");
		}
	} else {
		return usage(ctx);
	}
}

var save = function(data) {
	fs.writeFile("data/cache.json", JSON.stringify(data), function(err){
		if(err){ console.log(err); }
	});
};

var load = function(){
	if(fs.existsSync("data/cache.json")) {
		try {
			return require('./data/cache.json');
		} catch (e){
			return null;
		}
	} else {
		return null;
	}
}

function array_remove(array, from, to) {
	var rest = array.slice((to || from) + 1 || array.length);
	array.length = from < 0 ? array.length + from : from;
	return array.push.apply(array, rest);
};


function in_array(needle, haystack) {
    for(var i in haystack) {
        if(haystack[i] == needle) return true;
    }
    return false;
}

var parkArray = [];
console.log("Récupération de a liste des parks...")
for (park in Themeparks.Parks){
	parkArray.push('/park '+park)
}
console.log("Récupération terminée")

bot.startPolling()
