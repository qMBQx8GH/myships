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
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      for (let row of this.shipsTable.rows) {
        var checkboxes = row.getElementsByTagName('input');
        if (checkboxes && checkboxes.length == 1) {
          var checkbox = checkboxes[0];
          checkbox.checked = !!(newValue[checkbox.value]);
        }
      }
    }
  });
}

MyShipsTable.prototype.check = function () {
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
  const shipsData = shipsDataAll.filter(value =>
    value['group'] == 'special'
    || value['group'] == 'ultimate'
    || value['group'] == 'specialUnsellable'
    || value['group'] == 'upgradeableExclusive'
    || value['group'] == 'upgradeableUltimate'
  );

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

    shipsData.forEach(ship => {
      newRow = new_tbody.insertRow();
      newRow.id = ship.index;

      var newCell = newRow.insertCell();
      var checkbox = document.createElement('input');
      checkbox.type = "checkbox";
      checkbox.value = ship.index;
      checkbox.checked = !!(items['ships'] && items['ships'][ship.index]);
      checkbox.addEventListener('click', this.check);
      newCell.appendChild(checkbox);

      newCell = newRow.insertCell();
      newRow.dataset.level = ship['level'];
      newText = document.createTextNode(ship['level']);
      newCell.appendChild(newText);

      newCell = newRow.insertCell();
      newRow.dataset.nation = ship['nation'];
      newText = document.createTextNode(_(ship['nation']));
      newCell.appendChild(newText);

      newCell = newRow.insertCell();
      newRow.dataset.species = ship['species'];
      newText = document.createTextNode(_(ship['species']));
      newCell.appendChild(newText);

      newCell = newRow.insertCell();
      newText = document.createTextNode(ship[lang]);
      newCell.appendChild(newText);
    });

    this.shipsTable.replaceChild(new_tbody, old_tbody);
  });
}

const myShipsTable = new MyShipsTable(
  document.getElementById('shipsTable')
);
myShipsTable.display();
