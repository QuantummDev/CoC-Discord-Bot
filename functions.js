// Variables

const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const config = require('./config.json');

// Function to get the Top Trophies of your clan
function getTopTrophies(members, topCount) {
	const sortedMembers = members.sort((a, b) => b.trophies - a.trophies);

	return sortedMembers.slice(0, topCount);
}

// Function to get the Top Donators of your clan
function getTopDonators(members, topCount) {
	const sortedMembers = members.sort((a, b) => b.donations - a.donations);

	return sortedMembers.slice(0, topCount);
}

// Function to update your Server and bot Logo to your clans banner/logo ( If you dont like this feature make an issue and tell me. This bot was first made for personal use but i decided to release it for anyone that needs)
async function UpdateServerLogo(client, logoUrl) {
	try {
		client.guilds.cache.get(config.guildId).setIcon(logoUrl);
		client.user.setAvatar(logoUrl);
	}
	catch (error) {
		console.error('Error updating logos:', error.message);
	}
}

function encodeClanTag(clanTag) {
	return clanTag.replace('#', '%23');
}

// Function to save your clan info message id
async function saveClanInfo(guildId, clanInfoMessageId, ClanInfo) {
	try {
		const clanInfo = await ClanInfo.findOne({ guildId });

		if (clanInfo) {
			// Guild already exists, update the information
			clanInfo.clanInfoMessageId = clanInfoMessageId;
			await clanInfo.save();
		}
		else {
			// Guild does not exist, create a new entry
			await ClanInfo.create({
				guildId,
				clanInfoMessageId,
			});
		}
	}
	catch (error) {
		console.error('Error saving ClanInfo:', error.message);
	}
}

// Function to save your war info message id
async function saveWarInfo(guildId, warInfoMessageId, WarInfo) {
	try {
		const warInfo = await WarInfo.findOne({ guildId });

		if (warInfo) {
			// Guild already exists, update the information
			warInfo.warInfoMessageId = warInfoMessageId;
			await warInfo.save();
		}
		else {
			// Guild does not exist, create a new entry
			await WarInfo.create({
				guildId,
				warInfoMessageId,
			});
		}
	}
	catch (error) {
		console.error('Error saving WarInfo:', error.message);
	}
}

// Function to retrieve your message clan info messageId
async function getClanInfo(guildId, ClanInfo) {
	try {
		const clanInfo = await ClanInfo.findOne({ guildId });
		return clanInfo ? clanInfo.clanInfoMessageId : null;
	}
	catch (error) {
		console.error('Error retrieving ClanInfo:', error.message);
		return null;
	}
}

// Function to retrieve your message war info message id
async function getWarInfo(guildId, WarInfo) {
	try {
		const warInfo = await WarInfo.findOne({ guildId });
		return warInfo ? warInfo.warInfoMessageId : null;
	}
	catch (error) {
		console.error('Error retrieving WarInfo:', error.message);
		return null;
	}
}

// Get Encoded Clan Tag
const encodedClanTag = encodeClanTag(config.CLAN_TAG);

// Function to get Clan War Info
async function clanWarInfo(client, WarInfo) {
	try {
		const response = await axios.get(`https://api.clashofclans.com/v1/clans/${encodedClanTag}/currentwar`, {
			headers: { 'Authorization': `Bearer ${config.COC_API_KEY}` },
		});
		let hoursRemainingToEnd = null;
		let minutesRemainingToEnd = null;
		let hoursRemainingToStart = null;
		let minutesRemainingToStart = null;
		const data = response.data;
		const now = new Date();
		if (data.startTime) {
			const startDate = new Date(data.startTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z'));
			const endDate = new Date(data.endTime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z'));
			const timeDifferenceToEnd = endDate.getTime() - now.getTime();
			const timeDifferenceToStart = startDate.getTime() - now.getTime();
			hoursRemainingToEnd = Math.floor(timeDifferenceToEnd / (1000 * 60 * 60));
			minutesRemainingToEnd = Math.floor((timeDifferenceToEnd % (1000 * 60 * 60)) / (1000 * 60));
			hoursRemainingToStart = Math.floor(timeDifferenceToStart / (1000 * 60 * 60));
			minutesRemainingToStart = Math.floor((timeDifferenceToStart % (1000 * 60 * 60)) / (1000 * 60));
		}
		else {
			hoursRemainingToEnd = 'N/A Guerra';
			minutesRemainingToEnd = '';
			hoursRemainingToStart = 'N/a Guerra';
			minutesRemainingToEnd = '';
		}

		const channel = await client.channels.cache.get(config.WAR_CHANNEL_ID);

		const starsClan = '⭐'.repeat(data.clan.stars);
		const starsOpponent = '⭐'.repeat(data.opponent.stars);
		let state = null;
		if (data.state == 'notInWar') {
			state = 'Fora de guerra';
		}
		else if (data.state == 'preparation') {
			state = 'Preparação';
		}

		let teamInfo = '';
		let enemyInfo = '';
		try {
			if (data.state == 'notInWar') {
				state = 'Fora de guerra';
			}
			else if (data.state == 'preparation') {
				state = 'Preparação';
			}
			else {
				try {
					const warEmbed = new EmbedBuilder()
						.setColor(0x0099FF)
						.setTitle(`Guerra ${data.teamSize}v${data.teamSize}`)
						.setDescription(`${state}\nAtacar em: ${hoursRemainingToStart}h ${minutesRemainingToStart}m\n Fim em: ${hoursRemainingToEnd}h ${minutesRemainingToEnd}m`)
						.addFields(
							{ name: 'Equipa', value: `${data.clan.name} ${data.clan.attacks} ${data.clan.stars}\n${starsClan}`, inline: true },
							{ name: ' ', value: ' ', inline: true },
							{ name: 'Equipa', value: `${data.opponent.name} ${data.opponent.attacks} ${data.opponent.stars}\n${starsOpponent}`, inline: true },
						)
						.setTimestamp()
						.setThumbnail(data.clan.badgeUrls.large)
						.setFooter({ text: 'Feito por Quantum', iconURL: data.clan.badgeUrls.medium });
					const sortedMembers = data.clan.members.sort((a, b) => a.mapPosition - b.mapPosition);

					teamInfo = sortedMembers.map((player) => `${player.mapPosition}. ${player.name}\nCV: ${player.townhallLevel}\nAtaques oponentes: ${player.opponentAttacks}\n\n`).join('');

					const sortedOpponent = data.opponent.members.sort((a, b) => a.mapPosition - b.mapPosition);

					enemyInfo = sortedOpponent.map((player) => `${player.mapPosition}. ${player.name}\nCV: ${player.townhallLevel}\nAtaques oponentes: ${player.opponentAttacks}\n\n`).join('');

					warEmbed.addFields({ name: 'ㅤ', value: teamInfo, inline: true });
					warEmbed.addFields({ name: 'ㅤ', value: 'ㅤ', inline: true });
					warEmbed.addFields({ name: 'ㅤ', value: enemyInfo, inline: true });

					const warInfoMessageId = await getWarInfo(channel.guildId, WarInfo);
					if (warInfoMessageId) {
						try {

							const existingMessage = await channel.messages.fetch(warInfoMessageId);

							if (existingMessage) {
								existingMessage.edit({ embeds: [warEmbed] });
							}

							if (hoursRemainingToEnd == 0 & minutesRemainingToEnd === 5) {
								// Code to handle saving War logs in a channel
							}
						}
						catch (error) {
							console.error('Error fetching or editing message:', error.message);

							// Handle the error as needed
							if (error.code === 10008 || error.code === 10003) {
								// 10008: Unknown Message, 10003: Unknown Channel
								const newMessage = await channel.send({ embeds: [warEmbed] });
								saveWarInfo(channel.guild.id, newMessage.id, WarInfo);
							}
							else {
								// Other errors
								console.error('Unhandled error:', error);
							}
						}
					}
					else {
						const newMessage = await channel.send({ embeds: [warEmbed] });
						saveWarInfo(channel.guild.id, newMessage.id, WarInfo);
					}
				}
				catch (error) {
					console.error('Error sending message', error.message);
				}
			}
		}
		catch (error) {
			console.error('Error sending message:', error.message);
		}
	}
	catch (error) {
		console.error('Error getting clan war info:', error.message);
	}
}

// Function to get ClanInfo
async function syncClanInfo(client, ClanInfo) {
	try {
		// API post
		const response = await axios.get(`https://api.clashofclans.com/v1/clans/${encodedClanTag}`, {
			headers: { 'Authorization': `Bearer ${config.COC_API_KEY}` },
		});

		// Data gathering
		const clanInfo = response.data;
		const members = clanInfo.memberList;

		// Get top 3
		const topDonator = getTopDonators(members, 3);
		const topTrophies = getTopTrophies(members, 3);

		// Embed Creation
		const infoEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('IceTea')
			.setURL('https://link.clashofclans.com/pt?action=OpenClanProfile&tag=2GL2PQVJR')
			.setDescription(`${clanInfo.description}`)
			.addFields(
				{ name: 'Informações', value: `Nome: ${clanInfo.name}\nNivel: ${clanInfo.clanLevel}\nMembros: ${clanInfo.members}\nCapital de Cla: ${clanInfo.clanCapital.capitalHallLevel}\n`, inline: true },
				{ name: 'Guerra', value: `Vitórias: ${clanInfo.warWins}\nSequencia Vitórias: ${clanInfo.warWinStreak}\nDerrotas: ${clanInfo.warLosses}\nEmpates: ${clanInfo.warTies}\n`, inline: true },
				{ name: 'Trofeus', value: `Trofeus: ${clanInfo.clanPoints}\nTrofeus Construtor: ${clanInfo.clanBuilderBasePoints}`, inline: true },
				{ name: 'Top Doadores', value: `1. ${topDonator[0].name} ${topDonator[0].donations}\n2. ${topDonator[1].name} ${topDonator[1].donations}\n3. ${topDonator[2].name} ${topDonator[2].donations}\n`, inline: true },
				{ name: 'Top Trofeus', value: `1. ${topTrophies[0].name} ${topTrophies[0].trophies}\n2. ${topTrophies[1].name} ${topTrophies[1].trophies}\n3. ${topTrophies[2].name} ${topTrophies[2].trophies}\n`, inline: true },
				{ name: 'Requesitos', value: `Trofeus: ${clanInfo.requiredBuilderBaseTrophies}\nTrofeus Construtor: ${clanInfo.requiredVersusTrophies}\nCentro da Vila: ${clanInfo.requiredTownhallLevel}\n`, inline: true },
			)
			.setTimestamp()
			.setThumbnail(clanInfo.badgeUrls.large)
			.setFooter({ text: 'Feito por Quantum', iconURL: clanInfo.badgeUrls.medium });

		// Data gather
		const channel = await client.channels.cache.get(config.INFO_CHANNEL_ID);
		const imageurl = clanInfo.badgeUrls.large;

		// Pull messageId from MongoDB
		const clanInfoMessageId = await getClanInfo(channel.guildId, ClanInfo);
		if (clanInfoMessageId) {
			try {
				const existingMessage = await channel.messages.fetch(clanInfoMessageId);

				if (existingMessage) {
					existingMessage.edit({ embeds: [infoEmbed] });
				}
			}
			catch (error) {
				console.error('Error fetching or editing message:', error.message);

				// Handle the error as needed
				if (error.code === 10008 || error.code === 10003) {
					const newMessage = await channel.send({ embeds: [infoEmbed] });
					saveClanInfo(channel.guild.id, newMessage.id, ClanInfo);
				}
				else {
					// Other errors
					console.error('Unhandled error:', error);
				}
			}
		}
		else {
			const newMessage = await channel.send({ embeds: [infoEmbed] });
			saveClanInfo(channel.guild.id, newMessage.id, ClanInfo);
		}
		return imageurl;
	}
	catch (error) {
		console.error('Error syncing clan info:', error.message);
	}
}

// Exports
module.exports = { UpdateServerLogo, clanWarInfo, syncClanInfo };