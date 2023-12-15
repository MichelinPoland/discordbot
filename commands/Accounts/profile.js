const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const EVERYNAME_API_KEY = process.env.EVERYNAME_API_KEY;

async function checkAccess(interaction) {
    if (interaction.channelId == '1184451567173247016' || interaction.channelId == '1181352519872553000') {
        return true;
    } else {
        return false;
    }
}

async function getLinkedWallets(discord) {
    try {
        const response = await axios.get('http://129.159.251.230:3070/profile', {
            params: {
                discord: discord,
            },
        });

        return response.data.wallets;
    } catch (error) {
        console.error('Error fetching linked wallets:', error);
        return [];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays linked wallets for a Discord user')
        .addStringOption(option =>
            option
                .setName('discord')
                .setDescription('Specify the Discord user')
                .setRequired(true)),

    async execute(interaction) {
        const access = await checkAccess(interaction);
        if (!access) {
            return await interaction.reply({ content: 'This bot can only be used in <#1184451567173247016>', ephemeral: true });
        }

        const discord = interaction.options.getString('discord');
        const linkedWallets = await getLinkedWallets(discord);

        if (linkedWallets.length === 0) {
            return await interaction.reply('This user has not linked any wallets yet.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Linked Wallets for ${discord}`);

        for (const wallet of linkedWallets) {
            embed.addField('Wallet Address', wallet, true);
        }

        return await interaction.reply({ embeds: [embed] });
    },
};
