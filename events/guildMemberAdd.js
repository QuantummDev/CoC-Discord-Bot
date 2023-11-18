const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		if (member.user.bot()) return;

		const memberRole = ['1175252905893310526', '1175252905893310527'];
		const logsChannel = '1175310021517647942';

		try {
			// Assuming member.roles is a RoleManager, you can add multiple roles using the add method
			await member.roles.add(memberRole, 'Joined the server');
			member.guild.channels.cache.get(logsChannel).send(`Membro ${member.user} entrou no server`);
		}
		catch (error) {
			console.error('Failed giving role:', error.message);
		}
	},
};
