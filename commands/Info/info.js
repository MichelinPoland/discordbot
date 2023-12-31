const { EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const EVERYNAME_API_KEY = process.env.EVERYNAME_API_KEY;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const EVERYNAME_API = 'https://api.everyname.xyz/forward';

function formatLargeNumber(number) {
    const value = Number(number).toFixed(0);
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(0) + 'K';
    } else {
        return Number(number).toFixed(0);
    }
}

async function checkAccess(interaction) {
    if (interaction.channelId == '1184451567173247016' || interaction.channelId == '1181352519872553000') {
        return true;
    } else {
        return false;
    }
}

async function fetchInfo(interaction) {
    try {
        const openSeaData = await axios.get(`${OPENSEA_BASE_URL}/collections/michelin3xplorerclub/stats`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY,
            },
        });

        const cmcResponse = await axios.get(`${CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
            headers: {
                'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
            },
            params: {
                symbol: 'ETH',
            },
        });

        const cmcData = cmcResponse.data.data;
        const ethPriceUsd = cmcData.ETH.quote.USD.price;
        const volume = openSeaData.data.total.volume;
        const avgPrice = openSeaData.data.intervals[0].average_price.toFixed(4);
        const avgPriceUsd = (avgPrice * ethPriceUsd).toFixed(0);
        const totalValue = (openSeaData.data.intervals[0].average_price*2400).toFixed(0);
        const totalValueUsd = formatLargeNumber(ethPriceUsd * totalValue);
        const volumeUsd = formatLargeNumber(ethPriceUsd * volume);
        const sales = openSeaData.data.total.sales;
        const floorPrice = openSeaData.data.total.floor_price.toFixed(4);
        const floorUsd = (ethPriceUsd * floorPrice).toFixed(0);

        const floorPriceSymbol = openSeaData.data.total.floor_price_symbol;

        const openseaButton = new ButtonBuilder()
            .setLabel('View on Opensea')
            .setURL('https://opensea.io/collection/michelin3xplorerclub')
            .setStyle(ButtonStyle.Link);
        const openseaAction = new ActionRowBuilder()
            .addComponents(openseaButton);
        const infoEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Michelin 3XPLORE Collection Stats')
            .setURL('https://opensea.io/collection/michelin3xplorerclub')
            .setDescription(`
                **Volume:** ${formatLargeNumber(volume)} ETH [${volumeUsd}$]
                **Sales:** ${sales}\n
                **Floor Price:** ${floorPrice} ${floorPriceSymbol} [${floorUsd}$]
                **24h Floor AVG**: ${avgPrice} ${floorPriceSymbol} [${avgPriceUsd}$]
                **Collection Avg Value**: ${totalValue} ETH [${totalValueUsd}$] 
            `);
        interaction.reply({ embeds: [infoEmbed], components: [openseaAction] });
    } catch (error) {
        console.error('Error fetching wallet info:', error);
    }
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Replies with collection info!'),

    async execute(interaction) {
        const access = await checkAccess(interaction);
        if (!access) {
            await interaction.reply({ content: 'This bot can only be used in <#1184451567173247016>', ephemeral: true });
          }
        await fetchInfo(interaction);
    },
};
