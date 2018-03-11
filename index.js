const fs = require('fs');

const express = require('express');
const app = express();

const ScraperManager = require('./scraper_manager');
const Feed = require('./feed');

const userConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

//var serveStatic = require('serve-static');
// app.use(serveStatic('public/'))

const scraperManager = new ScraperManager(userConfig['scrapers']);

function initFeeds (config) {
  const feeds = [];
  for (let i = 0; i < config.length; i++) {
    const node = config[i];
    const routeName = node['route'] || '/feed/rss';
    const feed = new Feed(node['title'], routeName, node['scrapers'].map((name) => scraperManager.getScraper(name)));
    feeds.push(feed);
    app.get(routeName, function (req, res) {
      res.set('Content-Type', 'text/xml');
      return res.render('rss', {
        feed: {
          title: feed.getName()
        },
        items: feed.get()
      });
    });
    console.log(`Feed ${feed.getName()} created. Check it out: http://127.0.0.1:${userConfig['port']}${feed.getRoute()}`);
  }

  return feeds;
}

scraperManager.initialize().then(() => {
  console.log('INIT: scrappers');
  initFeeds(userConfig['feeds']);
  console.log('INIT: feeds');
});

app.listen(userConfig['port']);

const updateInterval = userConfig['updateInterval'] * 1000;

setInterval(() => {
  if (!scraperManager.ready()) {
    return;
  }

  console.log('Updating...');
  scraperManager.update();
}, updateInterval);