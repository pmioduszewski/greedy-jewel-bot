const dotenv = require("dotenv");
dotenv.config();
const fetch = require("isomorphic-fetch");
const { setIntervalAsync } = require("set-interval-async/dynamic");
const { getChanges, handleNotification, handleErrorNotification } = require("./utils.js");
const { Telegraf } = require("telegraf");

/** Store Data in memory */
const lastData = {
	lockedJewelTotal: "30308121046434255144595",
	totalStashes: "80",
};
const storeCurrentData = (lockedJewelTotal, totalStashes) => {
	lastData.lockedJewelTotal = lockedJewelTotal;
	lastData.totalStashes = totalStashes;
};

const checkForChanges = async (test = false, ctx) => {
	const currentData = await fetch("https://api.gmg.money/jewel/agg/summary", {
		credentials: "omit",
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0",
			Accept: "application/json, text/plain, */*",
			"Accept-Language": "en-US,en;q=0.5",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-site",
			"Sec-GPC": "1",
			Pragma: "no-cache",
			"Cache-Control": "no-cache",
		},
		referrer: "https://gmg.money/",
		method: "GET",
		mode: "cors",
	})
		.then((response) => response.json())
		.catch((err) => {
			console.error(err);
			return handleErrorNotification(bot, err);
		});

	try {
		console.log(`currentData.lockedJewelTotal = ${currentData?.lockedJewelTotal}`);
	} catch (error) {
		console.log("something is wrong with currentData");
	}

	const changes = getChanges(lastData, currentData);
	console.log(`Change: ${changes}`);

	// console.log(currentData);
	// console.log(`lastData ${JSON.stringify(lastData)}`);

	if (test) await handleNotification(bot, lastData, currentData, changes, ctx);
	else if (currentData?.lockedJewelTotal !== lastData?.lockedJewelTotal)
		await handleNotification(bot, lastData, currentData, changes);

	/** store current data in memory */
	storeCurrentData(currentData.lockedJewelTotal, currentData.totalStashes);
};

/** Telegram bot instance */
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

/** COMMAND: START */
bot.start((ctx) => ctx.reply("I'm alive!"));

/** COMMAND: TEST */
bot.command("test", async (ctx) => {
	return await checkForChanges(true, ctx);
});

/** Default response for undefinded msg/commands */
bot.on(
	"message",
	async (ctx) => await ctx.reply("I have no idea what You talking about ¯\\_( ͡❛ ͜ʖ ͡❛)_/¯")
);

/** bot catch errors here */
bot.catch(async (err, ctx) => {
	console.log(`Ooops, ecountered an error for ${ctx.updateType}`, err);

	await bot.telegram.sendMessage(process.env.MASTER_TELEGRAM_USER_ID, `Bot Catched ERROR: ${err}`);
});

/** run Telegram bot */
bot.launch();

// run forever
const interval = parseInt(process.env.FETCH_INTERVAL) || 1;
setIntervalAsync(async () => {
	console.log("interval START");
	await checkForChanges();
	console.log("interval DONE");
}, interval * 60 * 1000);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
