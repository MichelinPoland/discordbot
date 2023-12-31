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

async function checkDomain(domain) {
    try {
        const response = await axios.get(`${EVERYNAME_API}/forward?domain=${domain}`, {
            headers: {
                'Accept': 'application/json',
                'api-key': EVERYNAME_API_KEY,
            },
        });
        return response.data.address;
    } catch (error) {
        console.error('Error checking domain:', error);
        return null;
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
    try {
        const openSeaResponse = await axios.get(`${OPENSEA_BASE_URL}/chain/ethereum/account/${address}/nfts?collection=michelin3xplorerclub&limit=200`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY,
            },
        });
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
        const nftData = openSeaResponse.data;
        if (nftData.nfts.length === 0) {
            return interaction.reply(`${address} has no bibs`);
        }
        const owner = await checkName(address)
        await interaction.reply(`Returning list of all ${nftData.nfts.length} bibs owned by ${owner}`);

        for (const nft of nftData.nfts) {
            const id = nft.identifier;
            const price = await fetchBibPrice(id);
            const name = nft.name;
            const description = nft.description;
            const imageUrl = nft.image_url;
            console.log(nft)
            const openseaButton = new ButtonBuilder()
                .setLabel('View on Opensea')
                .setURL('https://opensea.io/collection/michelin3xplorerclub')
                .setStyle(ButtonStyle.Link);
            const openseaAction = new ActionRowBuilder()
                .addComponents(openseaButton);
            const infoEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Michelin3Xplorer #${id}`)
                .setURL('https://opensea.io/collection/michelin3xplorerclub')
                .setImage(imageUrl)
                .setDescription(`
                    **Owner:**: ${owner} \n 
                    **Price:**: ${price}\n
                `);
            interaction.followUp({ embeds: [infoEmbed], components: [openseaAction] });
        }
    } catch (error) {
        console.error('Error fetching wallet info:', error);
    }
}

async function fetchBibPrice(id) {
    try {
        const openSeaResponse = await axios.get(`${OPENSEA_BASE_URL}/orders/ethereum/seaport/listings`, {
            headers: {
                'accept': 'application/json',
                'x-api-key': OPENSEA_API_KEY,
            },
            params: {
                asset_contract_address: '0x87ec044115cd9e0e09221031441640ee48b3a8f2',
                limit: 1,
                order_by: 'created_date',
                token_ids: id,
            },
        });

        const openSeaData = openSeaResponse.data;
        if (openSeaData.orders[0]) {
            const price = openSeaData.orders[0].current_price / 1e+18;

            const cmcResponse = await axios.get(`${CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
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
                return `${price} ETH`;
            }
        } else {
            return `Not for sale`;
        }
    } catch (error) {
        console.error('Error fetching bib price:', error);
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
            if (domain !== null) {
                await fetchWalletInfo(interaction, domain);
            } else {
                console.log(`Wallet address is ${input}`);
                await fetchWalletInfo(interaction, input);
            }
        }
    },
};
