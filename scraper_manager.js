const LimeTorrents = require('./scrapers/lime_torrents');

const loadScraper = (type) => {
  switch (type) {
    case 'LimeTorrents':
      return LimeTorrents;
    default:
      throw Error(`Scraper with type ${type} doesn't exist.`);
  }
};

let ScraperManager = function (config) {
  this._scrapers = {};
  for (let i = 0; i < config.length; i++) {
    const node = config[i];

    const scraperClass = loadScraper(node.type);
    this._scrapers[node.id] = new scraperClass(node);
  }
};

ScraperManager.prototype = {
  initialize: function () {
    return Promise.all(Object.values(this._scrapers).map((s) => s.init()));
  },
  ready: function () {
    return Object.values(this._scrapers).every((v) => v._initialized);
  },
  update: function () {
    const keys = Object.keys(this._scrapers);
    for (let i = 0; i < keys.length; i++) {
      const scraper = this._scrapers[keys[i]];
      scraper.update();
    }
  },
  getScraper: function (id) {
    return this._scrapers[id];
  }
};

module.exports = ScraperManager;