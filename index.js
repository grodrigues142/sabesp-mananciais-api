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
  var date;
  var validation;

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

  function scrap(html, date) {
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
    var re = new RegExp('^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$');

    var limit = new Date('2003-01-01');

    if (!re.test(date) || new Date(date) < limit) {
      return false;
    }
    var y = date.slice(0, 4),
      m = date.slice(5, -3),
      d = date.slice(8);

    return {year: y, month: m, day: d};
  }

  function getValidation(html, date) {
    var data = cheerio.load(html);

    return {
      '__VIEWSTATE': data('#__VIEWSTATE').val(),
      '__EVENTVALIDATION': data('#__EVENTVALIDATION').val(),
      'Imagebutton1.x': 8,
      'Imagebutton1.y': 6,
      'cmbDia': date.day,
      'cmbMes': date.month,
      'cmbAno': date.year
    };
  }


  // Default URL - Data from today
  app.get('/', function (req, res) {
    request(url, function (error, response, html) {
      if (!error) {
        res.json(scrap(html));
      }
    });
  });

  // Date URL - Data from some date (2015/01/06)
  app.get('/:date', function (req, res) {

    date = validateDateEntry(req.params.date);

    request(url, function (error, response, html) {
      if (!error) {
        validation = getValidation(html, date);
      }
    });
    if (validation) {
      request({
        url: url,
        method: 'POST',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*-/*;q=0.8',
          'Host': 'www2.sabesp.com.br',
          'Origin': 'http://www2.sabesp.com.br',
          'Referer': url,
          'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.114 Safari/537.36'
        },
        jar: true,
        form: validation
      }, function (error, response, html) {
        if (!error) {
          res.json(scrap(html));
        }
      });
    } else {
      res.json({error: 'Something happens!'});
    }
  });

  app.listen(app.get('port'), function () {
    console.log('Magic happens on port: ' + app.get('port'));
  });

})();