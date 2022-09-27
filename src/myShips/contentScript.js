function MyShips () {
  this.shipsIndex = {};
}

MyShips.prototype.load = async function () {
  const jsonURL = chrome.runtime.getURL('ships.json');
  const response = await fetch(jsonURL);
  const shipsDataAll = await response.json();
  for (let shipId in shipsDataAll) {
    if (shipsDataAll.hasOwnProperty(shipId)) {
      let search = shipsDataAll[shipId].search;
      for (let i = 0; i < search.length; i++) {
        this.shipsIndex[search[i]] = shipId;
      }
    }
  }
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

MyShips.prototype.onGetStorage = function (items) {
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
        }
      } else {
        if (element.style.getPropertyValue('text-decoration') == 'line-through') {
          element.style.setProperty('text-decoration', '');
        }
      }
    }
  });
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
 