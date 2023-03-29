const express = require("express")
const cheerio = require('cheerio')
const exphbs = require('express-handlebars');
const axios = require('axios');
const { response } = require("express");
const mongoose = require("mongoose");
const Equipo = require("./Equipo");
const { helpers } = require("handlebars");
require('dotenv').config({ path: './.env' });


const port = 2000;
mongoose.connect(process.env.URI, function (error) {
  if (error) {
    console.log(error)
    return;
  }
  console.log("Se conecto a la base de datos")
  setInterval(() => {
    run()
  }, process.env.tiempo);


})

async function run() {
  try {
    const url = "https://www.futbolargentino.com/primera-division/tabla-de-posiciones";
    await axios(url).then((response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      $("#p_score_contenido_TorneoTabs_collapse3 > div > table > tbody").find('tr').each(async function (i) {

        var nombreE = $(this).find('span.d-none.d-md-inline').text();
        var posicionE = $(this).find('td:nth-child(1)').text()
        var pjE = $(this).find('td:nth-child(3)').text()
        var gE = $(this).find('td:nth-child(4)').text()
        var ppE = $(this).find('td:nth-child(5)').text()
        var peE = $(this).find('td:nth-child(6)').text()
        var gfE = $(this).find('td:nth-child(7)').text()
        var gcE = $(this).find('td:nth-child(8)').text()
        var dfE = $(this).find('td:nth-child(9)').text()
        var ptsE = $(this).find('td:nth-child(10)').text()
        var escudoE = $(this).find('a > img').attr('data-src')

        const datos = {
          nombre: nombreE,
          posicion: posicionE,
          partidosJugados: pjE,
          partidosGanados: gE,
          partidosEmpatados: peE,
          partidosPerdidos: ppE,
          goles: gfE,
          golesContra: gcE,
          diferenciaPuntos: dfE,
          puntos: ptsE,
          escudo: escudoE
        }

        try {
          await Equipo.findOneAndUpdate({ nombre: nombreE }, datos, { upsert: true });
        }
        catch (error) {
          console.error(error)
        }
      })

    }).catch(err => console.log(err));
  } catch (err) {
    console.log(err)
  }

}
const app = express();

app.engine('hbs', exphbs.engine({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: require('./helpers/handlebars-helpers')
}))

app.use(express.static('public'))
app.set('views', __dirname + '/views')
app.set('view engine', 'hbs')

app.get("/", async (req, res) => {
  var listaEquipos = await Equipo.find({}).sort({ posicion: 1 }).lean()
  var listaLongitud = listaEquipos.lenght
  res.render(
    'index',
    { listaEquipos, listaLongitud }
  )
})

app.listen(port, () => console.log('Server running on port ' + port));
run();

