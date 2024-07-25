function MyShips() {
  this.shipsIndex = {};
  this.shipsById = {};
  this.shipsIndexLoaded = false;
}

MyShips.prototype.load = async function () {
  const jsonURL = chrome.runtime.getURL('ships.json');
  const response = await fetch(jsonURL);
  const shipsData = await response.json();
  shipsData.forEach(ship => {
    let search = ship.search;
    for (let i = 0; i < search.length; i++) {
      this.shipsIndex[search[i]] = ship.index;
    }
    this.shipsById[ship.id] = ship.index;
  });
  this.shipsIndexLoaded = true;

  if (window.location.toString().includes('https://warehouse.') && this.shipsIndex) {
    const user_data_response = await fetch("/api/user_data/");
    const user_data = await user_data_response.json();
    if (!!user_data.spa_id && !!user_data.ships_in_port) {
      let shipsToStore = {};
      user_data.ships_in_port.forEach( shipId => {
        if (!!this.shipsById[shipId]) {
          shipsToStore[this.shipsById[shipId]] = true;
        }
      });
      chrome.storage.local.set({ships: shipsToStore});
      console.info('[MYSHIPS] updated (' + Object.keys(shipsToStore).length + ')')
    }
  }
}

MyShips.prototype.findAncestor = function (el, cls) {
  while ((el = el.parentElement) && !(el.classList.contains(cls)));
  return el;
}

MyShips.prototype.addOnClick = function (element, shipId) {
  element.dataset.shipid = shipId;
  element.addEventListener('click', function (e) {
    const elementClicked = e.target;
    console.info(elementClicked.dataset.shipid);
    chrome.storage.local.get('ships', items => {
      if (elementClicked.style.getPropertyValue('text-decoration') == 'line-through') {
        elementClicked.style.setProperty('text-decoration', '');
        if (items['ships']) {
          delete items['ships'][elementClicked.dataset.shipid];
        }
      } else {
        elementClicked.style.setProperty('text-decoration', 'line-through');
        if (!items['ships']) {
          items['ships'] = {};
        }
        items['ships'][elementClicked.dataset.shipid] = true;
      }
      var parent = myShips.findAncestor(elementClicked, 'loot-list');
      if (parent) {
        myShips.adjustTitle(parent, 'loot-list__title')
      }
      parent = myShips.findAncestor(elementClicked, 'loot-detail');
      if (parent) {
        myShips.adjustTitle(parent, 'loot-detail__title')
      }
      chrome.storage.local.set(items);
    });
  });
}

MyShips.prototype.adjustTitle = function (element, titleClass) {
  const title = element.getElementsByClassName(titleClass);
  if (title.length) {
    const vehicles = element.getElementsByClassName('we-vehicle__level');
    var countAll = 0;
    var countOf = 0;
    Array.from(vehicles).forEach(element => {
      countAll++;
      if (element.style.getPropertyValue('text-decoration') == 'line-through') {
        countOf++;
      }
    });
    console.info(title);
    let titleText = title[0].innerHTML.replace(/ \([0-9]+\/[0-9]+\)$/, '');
    title[0].innerHTML = titleText + ' (' + countOf + '/' + countAll + ')';
    }
}

MyShips.prototype.onGetStorage = function (items) {
  let hasChanged = false;
  Array.from(document.getElementsByClassName('we-vehicle__level')).forEach(element => {
    if (element.getAttribute('listener') !== 'true') {
      element.setAttribute('listener', 'true');
      if (this.shipsIndex[element.innerText]) {
        this.addOnClick(element, this.shipsIndex[element.innerText]);
        element.style.cursor = 'pointer';
      }
    }
    let shipId = this.shipsIndex[element.innerText] || '';
    if (shipId) {
      if (items['ships'] && items['ships'][shipId]) {
        if (element.style.getPropertyValue('text-decoration') != 'line-through') {
          element.style.setProperty('text-decoration', 'line-through');
          hasChanged = true;
        }
      } else {
        if (element.style.getPropertyValue('text-decoration') == 'line-through') {
          element.style.setProperty('text-decoration', '');
          hasChanged = true;
        }
      }
    }
  });
  if (hasChanged) {
    Array.from(document.getElementsByClassName('loot-list')).forEach(
      element => this.adjustTitle(element, 'loot-list__title')
    );
    Array.from(document.getElementsByClassName('loot-detail')).forEach(
      element => this.adjustTitle(element, 'loot-detail__title')
    );
  }
}

MyShips.prototype.check = function () {
  if (this.shipsIndexLoaded) {
    console.info('[MYSHIPS] Check');
    chrome.storage.local.get('ships', items => {
      this.onGetStorage(items);
    });
  }
  setTimeout(() => { this.check() }, 5000);
}

myShips = new MyShips();
myShips.load();
setTimeout(() => { myShips.check() }, 5000);
