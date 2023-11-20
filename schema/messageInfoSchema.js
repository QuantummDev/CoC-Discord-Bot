// Variables
const mongoose = require('mongoose');

// Clan Info Message Id Schema Creation
const clanInfoSchema = new mongoose.Schema({
	guildId: String,
	clanInfoMessageId: String,
});

// War Info Message Id Schema Creation
const warInfoSchema = new mongoose.Schema({
	guildId: String,
	warInfoMessageId: String,
});


module.exports = { clanInfoSchema, warInfoSchema };