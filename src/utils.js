const { BigNumber, utils } = require("ethers");

const diff = function (a, b) {
	return a > b ? a - b : b - a;
};

const bigNumberToFloat = function (n, decimals = 18) {
	if (typeof n === "string") {
		return parseFloat(utils.formatUnits(BigNumber.from(n), decimals));
	} else {
		return parseFloat(utils.formatUnits(n, decimals));
	}
};

exports.getChanges = (lastData, currentData) => {
	const last = bigNumberToFloat(lastData.lockedJewelTotal).toFixed();
	const current = bigNumberToFloat(currentData.lockedJewelTotal).toFixed();
	let difference = diff(last, current);

	if (last > current) {
		difference = difference * -1;
	}
	return difference;
};

exports.handleNotification = async (bot, lastData, currentData, changes, ctx) => {
	// prepare message text
	let msg = "";
	msg += `🔒 LockedTotal: <b>${bigNumberToFloat(
		currentData.lockedJewelTotal
	).toLocaleString()}</b> 💎 ${changes > 0 ? "🔼 " + changes : "⬇️ " + changes} \n`;
	msg += `🔄 From: <b>${bigNumberToFloat(
		lastData.lockedJewelTotal
	).toLocaleString()}</b> To <b>${bigNumberToFloat(
		currentData.lockedJewelTotal
	).toLocaleString()}</b>\n`;
	msg += `Stashed: <b>${currentData.totalStashes}</b>\n`;

	console.log(
		`send notification to: ${ctx ? ctx.message.from.id : process.env.MASTER_TELEGRAM_USER_ID}`
	);

	// send notification
	if (ctx) return await ctx.reply(msg, { parse_mode: "html" });
	return await bot.telegram.sendMessage(process.env.MASTER_TELEGRAM_USER_ID, msg, {
		parse_mode: "html",
	});
};
