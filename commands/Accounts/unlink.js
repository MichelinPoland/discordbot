const { EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const EVERYNAME_API_KEY = process.env.EVERYNAME_API_KEY;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const EVERYNAME_API = 'https://api.everyname.xyz';


async function unlinkWalletFromDiscord(discord, wallet) {
    try {
        console.log(discord)
        console.log(wallet)
        const response = await axios.delete('http://129.159.251.230:3070/unlink', {
            params: {
                discord: discord,
                wallet: wallet,
            },
        });

        if (response.data.success) {
            return `Wallet unlinked successfully`;
        } else {
            console.log(response.data)
            return `Error unlinking wallet: ${response.data.error}`;
        }
    } catch (error) {
        console.log(error.response.data.error)
        return `Error unlinking wallet: ${error.response.data.error}`;
    }
}



async function checkAccess(interaction) {
    if (interaction.channelId == '1184451567173247016' || interaction.channelId == '1181352519872553000') {
        return true;
    } else {
        return false;
    }
}

async function checkDomain(domain) {
    try {
        const response = await axios.get(`${EVERYNAME_API}/forward?domain=${domain}`, {
            headers: {
                'Accept': 'application/json',
                'api-key': EVERYNAME_API_KEY,
            },
        });
        console.log(response.data)
        if(response.data.success == false){
            return (false)
        }else{
            return response.data.address;
        }
    } catch (error) {
        console.error('Error checking domain:', error);
        return domain;
    }
}

async function checkName(address) {
    try {
        const response = await axios.get(`${EVERYNAME_API}/reverse/social-profile?address=${address}&provider=ens`, {
            headers: {
                'Accept': 'application/json',
                'api-key': EVERYNAME_API_KEY,
            },
        });
        console.log(response.data)
        if(!response.data.socialHandle){
            return address
        }else{
            return response.data.socialHandle;
        }
    } catch (error) {
        console.error('Error checking domain:', error);
        return null;
    }
}
async function fetchWalletInfo(interaction, address) {
    console.log(`Wallet address is ${address}`);
    const openSeaResponse = await axios.get(`${OPENSEA_BASE_URL}/accounts/${address}`, {
        headers: {
            'accept': 'application/json',
            'x-api-key': OPENSEA_API_KEY,
        },
    });
    const userId = interaction.user.id;
    const responseLink = await unlinkWalletFromDiscord(userId, address);
    interaction.reply(responseLink)
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlinks your discord with wallet!')
        .addStringOption(option =>
            option
                .setName('address')
                .setDescription('Specify the wallet address')
                .setRequired(true)),

    async execute(interaction) {
        const access = await checkAccess(interaction);
        if (!access) {
            await interaction.reply({ content: 'This bot can only be used in <#1184451567173247016>', ephemeral: true });
          }
        let input = interaction.options.getString('address');
        if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
            console.log("Input is valid");
            await fetchWalletInfo(interaction, input);
        } else {
            const domain = await checkDomain(input);
            if(domain == false){
                return interaction.reply(`ENS does not exist`)
            }
            if (domain !== null) {
                await fetchWalletInfo(interaction, domain);
            } else {
                console.log(`Wallet address is ${input}`);
                await fetchWalletInfo(interaction, input);
            }
        }
    },
};
