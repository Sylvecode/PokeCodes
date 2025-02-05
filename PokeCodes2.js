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
        const paragraphs = document.querySelectorAll("p");
        paragraphs.forEach((p) => {
          const text = p.innerText.trim();
          const match = text.match(/du\s+(.*?)\s+via/); // Utilisation d'une expression régulière pour récupérer le texte entre "du" et "via"
          if (match && match[1]) {
            const extractedText = match[1];
            dataList.push(extractedText);
          }
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
  