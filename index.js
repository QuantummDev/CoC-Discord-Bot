// Variables
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { clanInfoSchema, warInfoSchema } = require('./schema/messageInfoSchema.js');
const { UpdateServerLogo, clanWarInfo, syncClanInfo } = require('./functions.js');

// MongoDB
mongoose.connect(config.MONGODB_URI).then(() => console.log('MongoDB Connected'));
const ClanInfo = mongoose.model('ClanInfo', clanInfoSchema);
const WarInfo = mongoose.model('WarInfo', warInfoSchema);

// Client creation
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
});
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}`);

	// ClanInfo Function And Loop
	const logoUrl = await syncClanInfo(client, ClanInfo);
	setInterval(() => syncClanInfo(client, ClanInfo), 10 * 1000);

	// War Function And Loop
	await clanWarInfo(client, WarInfo);
	setInterval(() => clanWarInfo(client, WarInfo), 60 * 1000);

	// Update Logo's Function And loop

	await UpdateServerLogo(client, logoUrl);
	setInterval(() => UpdateServerLogo(client, logoUrl), 60 * 60 * 1000);
});

// Command And Event Handling
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

// UnhandledRejection Handling
process.on('unhandledRejection', (error) => {
	console.error('Unhandled promise rejection:', error);
});

// Client LogiN
client.login(config.TOKEN);
