const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
function getTopDonators(members, topCount) {
	const sortedMembers = members.sort((a, b) => b.donations - a.donations);

	return sortedMembers.slice(0, topCount);
}
function getTopTrophies(members, topCount) {
	const sortedMembers = members.sort((a, b) => b.trophies - a.trophies);

	return sortedMembers.slice(0, topCount);
}

client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`);
	const test = await syncClanInfo();
	UpdateServerLogo(test);
	clanWarInfo();
	setInterval(UpdateServerLogo, 60 * 60 * 1000);
	setInterval(syncClanInfo, 60 * 1000);
	setInterval(clanWarInfo, 10 * 1000);
});

let clanInfoMessageId = '1175300119239852032';
let raidInfoMessageId = '1175326866731700264';

async function UpdateServerLogo(test) {
	try {
		client.guilds.cache.get('1175252905771675690').setIcon(test);
		client.user.setAvatar(test);
	}
	catch (error) {
		console.error('Error updating logos:', error.message);
	}
}

function encodeClanTag(clanTag) {
	return clanTag.replace('#', '%23');
}

const encodedClanTag = encodeClanTag(config.CLAN_TAG);

async function syncClanInfo() {
	try {
		console.log(encodedClanTag);
		const response = await axios.get(`https://api.clashofclans.com/v1/clans/${encodedClanTag}`, {
			headers: { 'Authorization': `Bearer ${config.COC_API_KEY}` },
		});

		const clanInfo = response.data;
		const members = clanInfo.memberList;

		const topDonator = getTopDonators(members, 3);
		const topTrophies = getTopTrophies(members, 3);

		const infoEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('IceTea')
			.setURL('https://link.clashofclans.com/pt?action=OpenClanProfile&tag=2GL2PQVJR')
			.setDescription(`${clanInfo.description}`)
			.addFields(
				{ name: 'Informações', value: `Nome: ${clanInfo.name}\nNivel: ${clanInfo.clanLevel}\nMembros: ${clanInfo.members}\nCapital de Cla: ${clanInfo.clanCapital.capitalHallLevel}\n`, inline: true },
				{ name: 'Guerra', value: `Vitórias: ${clanInfo.warWins}\nSequencia Vitórias: ${clanInfo.warWinStreak}\nDerrotas: ${clanInfo.warLosses}\nEmpates: ${clanInfo.warTies}\n`, inline: true },
				{ name: 'Trofeus', value: `Trofeus: ${clanInfo.clanPoints}\nTrofeus Construtor: ${clanInfo.clanBuilderBasePoints}\nTrofeus Versus: ${clanInfo.clanVersusPoints}\n`, inline: true },
				{ name: 'ㅤ', value: 'ㅤ', inline: true },
				{ name: 'ㅤ', value: 'ㅤ', inline: true },
				{ name: 'ㅤ', value: 'ㅤ', inline: true },
				{ name: 'Top Doadores', value: `1. ${topDonator[0].name} ${topDonator[0].donations}\n2. ${topDonator[1].name} ${topDonator[1].donations}\n3. ${topDonator[2].name} ${topDonator[2].donations}\n`, inline: true },
				{ name: 'Top Trofeus', value: `1. ${topTrophies[0].name} ${topTrophies[0].trophies}\n2. ${topTrophies[1].name} ${topTrophies[1].trophies}\n3. ${topTrophies[2].name} ${topTrophies[2].trophies}\n`, inline: true },
				{ name: 'Requesitos', value: `Trofeus: ${clanInfo.requiredBuilderBaseTrophies}\nTrofeus Construtor: ${clanInfo.requiredVersusTrophies}\nCentro da Vila: ${clanInfo.requiredTownhallLevel}\n`, inline: true },
			)
			.setTimestamp()
			.setThumbnail(clanInfo.badgeUrls.large)
			.setFooter({ text: 'Feito por Quantum', iconURL: clanInfo.badgeUrls.medium });

		const channel = client.channels.cache.get('1175252930060894212');
		const imageurl = clanInfo.badgeUrls.large;


		if (clanInfoMessageId) {
			const existingMessage = await channel.messages.fetch(clanInfoMessageId);
			existingMessage.edit({ embeds: [infoEmbed] });
			console.log('message edited');
		}
		else {
			const newMessage = await channel.send({ embeds: [infoEmbed] });
			clanInfoMessageId = newMessage.id;
		}

		return imageurl;
	}
	catch (error) {
		console.error('Error syncing clan info:', error.message);
	}
}

async function clanWarInfo() {
	try {
		const response = await axios.get(`https://api.clashofclans.com/v1/clans/${encodedClanTag}/currentwar`, {
			headers: { 'Authorization': `Bearer ${config.COC_API_KEY}` },
		});

		const data = response.data;

		const startDate = new Date(data.startTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z'));
		const endDate = new Date(data.endTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z'));
		const channel = client.channels.cache.get('1175319580827201638');

		const now = new Date();
		const timeDifferenceToEnd = endDate.getTime() - now.getTime();
		const timeDifferenceToStart = startDate.getTime() - now.getTime();
		const hoursRemainingToEnd = Math.floor(timeDifferenceToEnd / (1000 * 60 * 60));
		const minutesRemainingToEnd = Math.floor((timeDifferenceToEnd % (1000 * 60 * 60)) / (1000 * 60));
		const hoursRemainingToStart = Math.floor(timeDifferenceToStart / (1000 * 60 * 60));
		const minutesRemainingToStart = Math.floor((timeDifferenceToStart % (1000 * 60 * 60)) / (1000 * 60));

		const starsClan = '⭐'.repeat(data.clan.stars);
		const starsOpponent = '⭐'.repeat(data.opponent.stars);

		const raidEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`Guerra ${data.teamSize}v${data.teamSize}`)
			.setDescription(`Atacar em: ${hoursRemainingToStart}h ${minutesRemainingToStart}m\n Fim em: ${hoursRemainingToEnd}h ${minutesRemainingToEnd}m`)
			.addFields(
				{ name: 'Equipa', value: `${data.clan.name} ${data.clan.attacks} ${data.clan.stars}\n${starsClan}`, inline: true },
				{ name: 'ㅤ', value: 'ㅤ', inline: true },
				{ name: 'Equipa', value: `${data.opponent.name} ${data.opponent.attacks} ${data.opponent.stars}\n${starsOpponent}`, inline: true },
			)
			.setTimestamp()
			.setThumbnail(data.clan.badgeUrls.large)
			.setFooter({ text: 'Feito por Quantum', iconURL: data.clan.badgeUrls.medium });

		let teamInfo = '';
		let enemyInfo = '';
		try {
			const sortedMembers = data.clan.members.sort((a, b) => a.mapPosition - b.mapPosition);
			sortedMembers.forEach((player) => {
				teamInfo += `${player.mapPosition}. ${player.name}\nCV: ${player.townhallLevel}\nAtaques oponentes: ${player.opponentAttacks}\n\n`;
			});

			const sortedOpponent = data.opponent.members.sort((a, b) => a.mapPosition - b.mapPosition);
			sortedOpponent.forEach((player) => {
				enemyInfo += `${player.mapPosition}. ${player.name}\nCV: ${player.townhallLevel}\nAtaques oponentes: ${player.opponentAttacks}\n\n`;
			});
		}
		catch (error) {
			console.error('Error test:', error.message);
		}

		raidEmbed.addFields({ name: 'ㅤ', value: teamInfo, inline: true });
		raidEmbed.addFields({ name: 'ㅤ', value: 'ㅤ', inline: true });
		raidEmbed.addFields({ name: 'ㅤ', value: enemyInfo, inline: true });
		if (raidInfoMessageId) {
			const existingMessage = await channel.messages.fetch(raidInfoMessageId);
			existingMessage.edit({ embeds: [raidEmbed] });
			console.log('message edited');
		}
		else {
			const newMessage = await channel.send({ embeds: [raidEmbed] });
			raidInfoMessageId = newMessage.id;
		}


	}
	catch (error) {
		console.error('Error getting clan war info:', error.message);
	}
}
client.login(config.TOKEN);
