(function () {
  'use strict';
  var request = require('request'),
      cheerio = require('cheerio'),
      Promise = require('promise'),
      Helper  = require('./Helper');

  // Our Sabesp url
  var token;

  Helper.dams = {
    'sistemaCantareira': 'Cantareira',
    'sistemaAltoTiete': 'Alto Tietê',
    'sistemaGuarapiranga': 'Guarapiranga',
    'sistemaCotia': 'Alto Cotia',
    'sistemaRioGrande': 'Rio Grande',
    'sistemaRioClaro': 'Rio Claro'
  };

  var url = 'http://www2.sabesp.com.br/mananciais/DivulgacaoSiteSabesp.aspx';

  var Sabesp = {};
  Sabesp.fetch = function(date) {
    if (date) {
      return new Promise(function(resolve, reject) {
        var data = Helper.buildData(date, token);

        request({
            'url': url,
            'method': 'POST',
            'headers': {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*-/*;q=0.8',
              'Host': 'www2.sabesp.com.br',
              'Origin': 'http://www2.sabesp.com.br',
              'Referer': url,
              'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.114 Safari/537.36',
            },
            'jar': true,
            'form': data,
          }, function(error, response, html){
            resolve(Helper.parserHTML(html));
          }
        );

      });
    } else {
      return new Promise(Sabesp.today);
    }
  };
  Sabesp.today = function(resolve, reject) {
    request(url, function (error, response, html) {
      if (error) {
        reject(error);
      } else {
        resolve(Helper.parserHTML(html));
      }
    });
  };
  Sabesp.getToken = function() {
    return new Promise(function(resolve, reject) {
      request(url, function (error, response, html) {
        if (error) {
          reject(error);
        } else {
          var $ = cheerio.load(html),
              ret = {
                state: $('#__VIEWSTATE').val(),
                validation: $('#__EVENTVALIDATION').val()
              };
          resolve(ret);
        }
      });
    });
  };

  Sabesp.getToken().then(function(resolve, reject) {
    token = resolve;
  });

  module.exports = Sabesp;
})();
