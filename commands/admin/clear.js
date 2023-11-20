// Variables
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Comando para limpar uma quantiade de mensagens')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setDMPermission(false)
		.addIntegerOption(option =>
			option.setName('amount')
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true)
				.setDescription('Quantidade de mensagens para deletar (Max 100)')),


	async execute(interaction) {
		const { channel, options } = interaction;
		const amount = options.getInteger('amount');
		channel.bulkDelete(amount);
		await interaction.reply({ content: `Sucesso a deletar! ${amount} mensagens`, ephemeral: true });
	},
};