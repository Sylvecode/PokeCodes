const puppeteer = require("puppeteer");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
require('dotenv').config();

// Remplacez par le token de votre bot Discord
const discordToken = process.env.DISCORD_TOKEN;

// Remplacez par l'ID de votre canal Discord
const channelId = process.env.CHANNEL_ID;

// Créez une nouvelle instance de client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

async function scrapeWebsite() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(
    "https://www.pokepedia.fr/Liste_des_Pok%C3%A9mon_distribu%C3%A9s_en_2024",
    { waitUntil: "networkidle2" }
  );

  try {
    // Extraire les noms et les textes en gras organisés en liste
    const data = await page.evaluate(() => {
      const dataList = [];
      const divs = document.querySelectorAll("div h3");
      divs.forEach((div) => {
        const pokemonName = div.innerText.trim();
        const boldTexts = div.nextElementSibling.querySelectorAll("b");
        const boldText = boldTexts[0].innerText.trim(); // Sélectionner le premier texte en gras
        dataList.push({ pokemonName, boldText });
      });
      return dataList;
    });

    await browser.close();
    return data;
  } catch (error) {
    await page.screenshot({ path: "error_screenshot.png" });
    await browser.close();
    throw error;
  }
}

async function sendUpdate(dataList) {
  const channel = await client.channels.fetch(channelId);

  // Construire le message avec toutes les données
  let message = "\n\nDistribution Pokémon en cours\n\n";
  dataList.forEach((item) => {
    message += `${item.pokemonName}\nCode : **${item.boldText}**\n\n`;
  });

  // Envoyer le message sur Discord
  channel.send(message);
}

// Commande pour démarrer le script de scraping
client.on("messageCreate", async (message) => {
  if (message.content === "!startscraping") {
    const channel = await client.channels.fetch(channelId);
    try {
      // Récupérer les informations de la page web
      const dataList = await scrapeWebsite();
      await sendUpdate(dataList, channel);
    } catch (error) {
      console.error("Failed to scrape website:", error);
      await channel.send("Failed to scrape website.");
    }
  }
});
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  try {
    // Récupérer les informations de la page web
    const dataList = await scrapeWebsite();
    await sendUpdate(dataList);
  } catch (error) {
    console.error("Failed to scrape website:", error);
  }
});

client.login(discordToken);
