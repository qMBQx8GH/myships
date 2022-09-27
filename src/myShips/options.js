function _(msg) {
  return chrome.i18n.getMessage(msg) || msg;
}

function textNodesUnder(el) {
  var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while (n = walk.nextNode()) a.push(n);
  return a;
}

function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName('body');
  for (var i = 0; i < objects.length; i++) {
    textNodesUnder(objects[i]).forEach(obj => {
      var valStrH = obj.nodeValue;
      var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
        return v1 ? chrome.i18n.getMessage(v1) : "";
      });

      if (valNewH != valStrH) {
        obj.nodeValue = valNewH;
      }
    });
  }
}

localizeHtmlPage();

function MyShipsTable(shipsTable) {
  this.shipsTable = shipsTable;
  this.levelSelect = document.createElement('select');
  this.nationSelect = document.createElement('select');
  this.speciesSelect = document.createElement('select');
}

MyShipsTable.prototype.check = function () {
  console.info(this);
  chrome.storage.local.get('ships', items => {
    console.info(items);
    if (!items['ships']) {
      items['ships'] = {};
    }
    if (this.checked) {
      items['ships'][this.value] = true;
    } else if (items['ships'][this.value]) {
      delete items['ships'][this.value];
    }
    chrome.storage.local.set(items);
  });
}

MyShipsTable.prototype.filter = function () {
  for (let row of this.shipsTable.rows) {
    if (
      'level' in row.dataset
      && 'nation' in row.dataset
      && 'species' in row.dataset
    ) {
      if (
          (this.levelSelect.value == '' || this.levelSelect.value == row.dataset.level)
          && (this.nationSelect.value == '' || this.nationSelect.value == row.dataset.nation)
          && (this.speciesSelect.value == '' || this.speciesSelect.value == row.dataset.species)
      ) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  }
}

MyShipsTable.prototype.display = async function () {
  const response = await fetch('ships.json');
  const shipsDataAll = await response.json();
  const asArray = Object.entries(shipsDataAll);
  const filtered = asArray.filter(([key, value]) => value['group'] == 'special');
  const shipsData = Object.fromEntries(filtered);

  chrome.storage.local.get('ships', items => {
    const old_tbody = this.shipsTable.getElementsByTagName('tbody')[0];
    const new_tbody = document.createElement('tbody');
    lang = chrome.i18n.getMessage('@@ui_locale').split(/_/)[0] == 'ru' ? 'ru' : 'en';
    const levels = [...new Map(Object.values(shipsData).map(item => [item['level'], item['level']])).values()].sort(function (a, b) {
      return a - b;
    });
    const nations = [...new Map(Object.values(shipsData).map(item => [item['nation'], item['nation']])).values()].sort();
    const species = [...new Map(Object.values(shipsData).map(item => [item['species'], item['species']])).values()].sort();

    var newRow = new_tbody.insertRow();

    var newCell = newRow.insertCell();
    newRow.appendChild(newCell);

    newCell = newRow.insertCell();
    this.levelSelect.appendChild(new Option(_('all'), ''));
    levels.forEach(level => {
      this.levelSelect.appendChild(new Option(level, level));
    });
    this.levelSelect.addEventListener('change', this.filter.bind(this), false);
    newCell.appendChild(this.levelSelect);
    newRow.appendChild(newCell);

    newCell = newRow.insertCell();
    this.nationSelect.appendChild(new Option(_('all'), ''));
    nations.forEach(nation => {
      this.nationSelect.appendChild(new Option(nation, _(nation)));
    });
    this.nationSelect.addEventListener('change', this.filter.bind(this), false);
    newCell.appendChild(this.nationSelect);
    newRow.appendChild(newCell);

    newCell = newRow.insertCell();
    this.speciesSelect.appendChild(new Option(_('all'), ''));
    species.forEach(shipClass => {
      this.speciesSelect.appendChild(new Option(shipClass, _(shipClass)));
    });
    this.speciesSelect.addEventListener('change', this.filter.bind(this), false);
    newCell.appendChild(this.speciesSelect);
    newRow.appendChild(newCell);

    var newCell = newRow.insertCell();
    newRow.appendChild(newCell);

    for (var shipId in shipsData) {
      if (shipsData.hasOwnProperty(shipId)) {
        newRow = new_tbody.insertRow();
        newRow.id = shipId;

        var newCell = newRow.insertCell();
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.value = shipId;
        checkbox.checked = !!(items['ships'] && items['ships'][shipId]);
        checkbox.addEventListener('click', this.check);
        newCell.appendChild(checkbox);

        newCell = newRow.insertCell();
        newRow.dataset.level = shipsData[shipId]['level'];
        newText = document.createTextNode(shipsData[shipId]['level']);
        newCell.appendChild(newText);

        newCell = newRow.insertCell();
        newRow.dataset.nation = shipsData[shipId]['nation'];
        newText = document.createTextNode(_(shipsData[shipId]['nation']));
        newCell.appendChild(newText);

        newCell = newRow.insertCell();
        newRow.dataset.species = shipsData[shipId]['species'];
        newText = document.createTextNode(_(shipsData[shipId]['species']));
        newCell.appendChild(newText);

        newCell = newRow.insertCell();
        newText = document.createTextNode(shipsData[shipId][lang]);
        newCell.appendChild(newText);
      }
    }

    this.shipsTable.replaceChild(new_tbody, old_tbody);
  });
}

const myShipsTable = new MyShipsTable(
  document.getElementById('shipsTable')
);
myShipsTable.display();
