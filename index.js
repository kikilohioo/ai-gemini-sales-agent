const express = require('express');
const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBZp2M33EdiyvenMKdu-HaXA38jz-OYL-g");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = 3000;

app.get('/', async (req, res) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://finance.yahoo.com/topic/latest-news/');

	let prompt = `
	Tienes una lista de noticias financieras en formato JSON. Analiza la información y responde con un resumen de los eventos más relevantes para inversiones. Considera:

    Tendencias macroeconómicas: Inflación, tasas de interés, políticas monetarias.
    Movimientos de mercado: Subidas/bajadas significativas en acciones, criptomonedas, materias primas.
    Eventos clave: Fusiones, adquisiciones, reportes de ganancias, regulaciones nuevas.
    Sentimiento del mercado: ¿Es positivo o negativo según las noticias?
    Acciones recomendadas: ¿Dónde hay oportunidades o riesgos claros?

	Devuelve un análisis claro y conciso con insights accionables, en formato Markdown.
	Aqui tienes el JSON:
	
	`;

	const news = await page.evaluate(() => {
		return Array.from(document.querySelectorAll('li.stream-item.story-item.yf-1usaaz9')).map(item => {
			const titleElement = item.querySelector('h3');
			const contentElement = item.querySelector('p');
			const categoryElement = item.querySelector('.taxonomy-links a');
			const linkElement = item.querySelector('a.subtle-link');

			return {
				title: titleElement ? titleElement.textContent.trim() : null,
				content: contentElement ? contentElement.textContent.trim() : null,
				category: categoryElement ? categoryElement.textContent.trim() : null,
				link: linkElement ? linkElement.href : null
			};
		});
	});

	prompt += JSON.stringify(news)

	console.log(prompt)
	const result = await model.generateContent(prompt);
	console.log(result.response.text());

	await browser.close();
	res.json({ result: result.response.text() });
});

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});