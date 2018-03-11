let Feed = function (name, route, providers) {
  this._name = name;
  this._route = route;
  this._providers = providers;
};

const xmlEscapeMap = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;'
};

function encodeXml(string) {
  return string.replace(/([\&"<>])/g, function(str, item) {
    return xmlEscapeMap[item];
  });
}

const dateSort = function (a, b ){
  if (a.date > b.date) return -1;
  if (a.date < b.date) return 1;
  return 0;
};

Feed.prototype = {
  getName: function () {
    return this._name;
  },
  getRoute: function () {
    return this._route;
  },
  get: function () {
    const items = this._providers.reduce((accumulator, value) => {return value.getItems().concat(accumulator)}, []);
    return items.map((i) => {i.torrent = encodeXml(i.torrent); return i;}).sort(dateSort);
  }
};

module.exports = Feed;