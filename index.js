const fs = require('fs');

const express = require('express');
const app = express();

const heroTorrents = require('./scrapers/hero_torrents');

const userConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

//var serveStatic = require('serve-static');
// app.use(serveStatic('public/'))

var xml_special_to_escaped_one_map = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;'
};

function encodeXml(string) {
  return string.replace(/([\&"<>])/g, function(str, item) {
    return xml_special_to_escaped_one_map[item];
  });
};

const scrapers = userConfig.feeds.map((f) => new heroTorrents(f['searchTerm'], f['title']));

var feed = [];
Promise.all(scrapers.map((s) => s.init())).then(() => {
  console.log('init done.');
  const items = scrapers.reduce((accumulator, value) => {return value.getItems().concat(accumulator)}, []);
  for (let i = 0; i < items.length; i++) {
    console.log(`${items[i].name} | ${items[i].torrent.substr(0, 40)} | ${items[i].date}`);
  }
  feed = items.map((i) => {i.torrent = encodeXml(i.torrent); return i;});
});

var date_sort_desc = function (a, b ){
  if (a.date > b.date) return -1;
  if (a.date < b.date) return 1;
  return 0;
};

app.get('/feed/rss', function (req, res) {
  res.set('Content-Type', 'text/xml');
  return res.render('rss', {
    feed: { title: userConfig['feedTitle'] },
    items: feed.sort(date_sort_desc)
  })
});

app.listen(userConfig['port']);

const updateInterval = userConfig['updateInterval'] * 1000;

setInterval(() => {
  if (!scrapers.every((v) => v._initialized)) {
    return;
  }

  console.log('Updating...');
  scrapers.forEach((v) => v.update());

  const items = scrapers.reduce((accumulator, value) => {return value.getItems().concat(accumulator)}, []);
  feed = items.map((i) => {i.torrent = encodeXml(i.torrent); return i;});
}, updateInterval);