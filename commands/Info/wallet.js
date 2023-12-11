const { EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const EVERYNAME_API_KEY = process.env.EVERYNAME_API_KEY;
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

async function checkDomain(domain) {
    try {
        const response = await axios.get(`https://api.everyname.xyz/forward?domain=${domain}`, {
            headers: {
                'Accept': 'application/json',
                'api-key': EVERYNAME_API_KEY,
            },
        });

        return response.data.address;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function fetchWalletInfo(interaction, address) {
    console.log(`wallet adress is ${address}`)
    try {
        // Make an API call to OpenSea to retrieve NFTs owned by the wallet
        const openSeaResponse = await axios.get(`https://api.opensea.io/api/v2/chain/ethereum/account/${address}/nfts?collection=michelin3xplorerclub&limit=200`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY,
            },
        });

        const nftData = openSeaResponse.data;
        if (nftData.nfts.length === 0) {
            return interaction.reply(`${address} has no bibs`);
        }

        interaction.reply(`Returning list of all ${nftData.nfts.length} bibs owned by ${address}`);

        // Iterate through the "nfts" array and send information for each item
        for (const nft of nftData.nfts) {
            const id = nft.identifier;
            const price = await fetchbibPrice(id);
            const name = nft.name;
            const description = nft.description;
            const imageUrl = nft.image_url;

            const bibEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`BIB: ${name}`)
                .setDescription(description)
                .addField('Price', price, true)
                .setImage(imageUrl);

            await interaction.followUp({ embeds: [bibEmbed] });
        }
    } catch (error) {
        console.error(error);
        interaction.reply({ content: 'We are sorry but there was an error while fetching data pls try again later or contact support!', ephemeral: true });
    }
}

async function fetchbibPrice(id) {
    try {
        const openSeaResponse = await axios.get(`https://api.opensea.io/api/v2/orders/ethereum/seaport/listings?asset_contract_address=0x87ec044115cd9e0e09221031441640ee48b3a8f2&limit=1&order_by=created_date&token_ids=${id}`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY,
            },
        });

        const openSeaData = openSeaResponse.data;
        if (openSeaData.orders[0]) {
            const price = openSeaData.orders[0].current_price / 1e+18;

            // Make an API call to CoinMarketCap to get the ETH price
            const cmcResponse = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
                headers: {
                    'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
                },
                params: {
                    symbol: 'ETH',
                },
            });

            const cmcData = cmcResponse.data.data;
            if (cmcData.ETH) {
                const ethPriceUsd = cmcData.ETH.quote.USD.price;
                return `Price: ${price} ETH [${(price * ethPriceUsd).toFixed(2)}$]`;
            } else {
                return `Price: ${price} ETH`;
            }
        } else {
            return `Price: Not for sale`;
        }
    } catch (error) {
        console.error(error);
        return 'Error fetching data. Please try again later.';
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Replies with wallet NFTs info!')
        .addStringOption(option =>
            option
                .setName('address')
                .setDescription('Specify the wallet address')
                .setRequired(true)),

    async execute(interaction) {
        let input = interaction.options.getString('address');
        if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
            console.log("Input is valid");
            await fetchWalletInfo(interaction, input);
            } else {
            const domain = await checkDomain(input);
            if (domain !== null) {
                await fetchWalletInfo(interaction, domain);
            } else {
                console.log(`wallet adress is${input}`)
                await fetchWalletInfo(interaction, input);
            }
            }

    },
};
