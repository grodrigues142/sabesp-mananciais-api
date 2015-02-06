(function () {
  'use strict';
  var express = require('express'),
  request = require('request'),
  cheerio = require('cheerio'),
  app     = express();

  // Heroku port settings
  app.set('port', (process.env.PORT || 8080));
  // app.use(express.static(__dirname));

  // Our Sabesp url
  var url = 'http://www2.sabesp.com.br/mananciais/DivulgacaoSiteSabesp.aspx';

  // TODO: Improve this mess
  function getSistemaName(name) {
    name = name.split(/[./]+/)[1];

    switch (name) {
      case 'sistemaCantareira':
        return 'Cantareira';
      case 'sistemaAltoTiete':
        return 'Alto Tietê';
      case 'sistemaGuarapiranga':
        return 'Guarapiranga';
      case 'sistemaCotia':
        return 'Alto Cotia';
      case 'sistemaRioGrande':
        return 'Rio Grande';
      case 'sistemaRioClaro':
        return 'Rio Claro';
    }
  }

  function getData(html) {
    var $ = cheerio.load(html);

    var json = [];

    $('#tabDados').filter(function () {

      var data = $(this);

      /*===========================
      * TODO: Improve this loops
      ===========================*/

      // Fetch each images on context
      data.find('img').each(function (i, elem) {
        json[i] = {
          name : getSistemaName(elem.attribs.src),
          data : []
        };
      });

      // Fetch each td with content "volume armazenado"
      data.find('td:contains(volume armazenado)').each(function (i, elem) {
        json[i].data.push({
          key : 'volume armazenado',
          value : $(elem).next().text()
        });
      });

      // Fetch each td with content "pluviometria do dia"
      data.find('td:contains(pluviometria do dia)').each(function (i, elem) {
        json[i].data.push({
          key : 'pluviometria do dia',
          value : $(elem).next().text()
        });
      });

      // Fetch each td with content "pluviometria acumulada no mês"
      data.find('td:contains(pluviometria acumulada no mês)').each(function (i, elem) {
        json[i].data.push({
          key : 'pluviometria acumulada no mês',
          value : $(elem).next().text()
        });
      });

      // Fetch each td with content "média histórica do mês"
      data.find('td:contains(média histórica do mês)').each(function (i, elem) {
        json[i].data.push({
          key : 'média histórica do mês',
          value : $(elem).next().text()
        });
      });

    });

    return json;
  }

  function validateDateEntry(date) {
    var re = new RegExp('^[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$');

    // Valid string length
    if (date.length !== 10 || date.length !== 8) {
      return false;
    }

    if (date.length === 10) {
      date = date.split('-').join('');
    }

    if (re.test(date)) {
      var limit = new Date('2003-01-01'),
        y = date.slice(0, 4),
        m = date.slice(4, -2),
        d = date.slice(6),
        request = new Date(y + '-' + m + '-' + d);

      if (request < limit) {
        return false;
      }

      return {year: y, month: m, day: d};
    }
  }

  // Default URL - Data from today
  app.get('/', function (req, res) {

    request(url, function (error, response, html) {
      if (!error) {
        res.json(getData(html));
      }
    });
  });

  // Date URL - Data from some date (2015/01/06)
  app.get('/:date', function (req, res) {
    console.log(req.params.date.length);
    console.log(validateDateEntry(req.params.date));
    res.send(req.params.date);
  });

  app.listen(app.get('port'), function () {
    console.log('Magic happens on port: ' + app.get('port'));
  });

})();