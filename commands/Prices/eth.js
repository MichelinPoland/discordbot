const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

async function checkAccess(interaction) {
  if (interaction.guild.id == '1173381102522609746') {
      return true;
  } else {
      return false;
  }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('price')
		.setDescription('Replies with ETH price!')
    .addStringOption(option =>
      option 
        .setName('amount')
        .setDescription('Define amount of tokens')
        .setRequired(false)),

	async execute(interaction) {
    const access = await checkAccess(interaction);
    if (!access) {
        return interaction.reply('You dont have acess to this bot.');
    }
    const amount = interaction.options.getString('amount')
    try {
        // Make an API call to CoinMarketCap
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
          headers: {
            'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          },
          params: {
            symbol: 'ETH', //
          },
        });
    
        const data = response.data.data;
        if (data && data.ETH) {
          if(!amount){
            const price = data.ETH.quote.USD.price;
            interaction.reply(`The current price of $ETH is $${price.toFixed(3)}`);
          }else{
            const price = data.ETH.quote.USD.price.toFixed(3)*amount;
            interaction.reply(`The current price of ${amount} $ETH is $${price.toFixed(3)}`);
          }
        } else {
          interaction.reply('Cryptocurrency data not found.');
        }
      } catch (error) {
        console.error(error);
        interaction.reply({ content: 'We are sorry but there was an error while fetching data pls try again later or contact support!', ephemeral: true });
      }
	},
};