const Xray = require('x-ray');
const x = Xray();

const cheerio = require('cheerio');

const chrono = require('chrono-node');


const queryString = require('querystring');

let HeroTorrents = function (options) {
  this._url += `${queryString.escape(options.searchTerm)}/`;
  this._titleMatch = options.titleMatch;
};

HeroTorrents.prototype = {
  _url: 'https://herotorrents.com/search/all/',
  _baseScope: 'table.table2',
  _innerScope: 'a+a',
  _matchedResults: [],
  _initialized: false,

  init: async function () {
    this._matchedResults = await this._scrapeSearchResults();
    for (let i = 0; i < this._matchedResults.length; i++) {
      //console.log(this._matchedResults[i].link);
      const details = await this._scrapeDetails(this._matchedResults[i].link);
      this._matchedResults[i].date = details.date;
      this._matchedResults[i].torrent = details.torrent;
    }
    this._initialized = true;
  },

  update: async function () {
    if (!this._initialized) {
      return;
    }
    const newResults = await this._scrapeSearchResults();
    const oldLinks = this._matchedResults.map((m) => m.link);

    for (let i = 0; i < newResults.length; i++) {
      if (oldLinks.includes(newResults[i].link)) {
        continue;
      }

      console.log(`NEW: ${newResults[i].name}`);
      const details = await this._scrapeDetails(newResults[i].link);
      newResults[i].torrent = details.torrent;
      console.log(`torrent: ${details.torrent.substr(0, 60)}`);

      this._matchedResults.unshift(newResults[i]);
    }
  },

  getItems: function () {
    return this._matchedResults.slice(0);
  },

  _scrapeSearchResults: function () {
    return new Promise((resolve, reject) => {
      return x(this._url, this._baseScope, ['.tt-name@html'])( (err, ttList) => {
        const matchedResults = [];
        for (let i = 0; i < ttList.length; i++) {
          const $ = cheerio.load(ttList[i]);
          const link = $(this._innerScope);

          if(!this._matchTitle(link.text())) {
            continue;
          }
          matchedResults.push({name: link.text(), link: link.attr('href')});
        }

        resolve(matchedResults);
      });
    });
  },

  _scrapeDetails: function (url) {
    return new Promise((resolve, reject) => {
      const downloadLinks = 'div.downloadarea>.dltorrent>p';
      x(url, 'div#content@html')((err, html) => {
        const $ = cheerio.load(html);

        const dateTd = $($('.torrentinfo>table>tbody>tr+tr>td+td')[0]);
        dateTd.children().remove();
        const dateString = dateTd.text().replace('in  - ', '');

        const linkList = $(downloadLinks);
        for (let i = 0; i < linkList.length; i++) {
          const link = $(linkList[i]).find('a');

          if(!link.text().includes('Magnet')) {
            continue;
          }

          resolve({
            torrent: link.attr('href'),
            date: chrono.parseDate(dateString)
          });
          return;
        }
        reject();
      });
    });
  },

  _matchTitle: function (testString) {
    return testString.match(this._titleMatch) !== null;
  }
};

module.exports = HeroTorrents;