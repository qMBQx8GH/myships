function MyShips() {
  this.shipsIndex = {};
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
  });

  this.shipsIndex.loaded = true;
  console.info(this.shipsIndex);
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
      console.info(items);
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
  if (this.shipsIndex.loaded) {
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
