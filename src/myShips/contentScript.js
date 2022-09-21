function myShipsCheck() {
  console.info('[MYSHIPS] Check');
  chrome.storage.local.get('ships', items => {
    Array.from(document.getElementsByClassName('we-vehicle__level')).forEach(element => {
      if (element.getAttribute('listener') !== 'true') {
        element.setAttribute('listener', 'true');
        element.addEventListener('click', function (e) {
          const elementClicked = e.target;
          chrome.storage.local.get('ships', items => {
            if (elementClicked.style.getPropertyValue('text-decoration') == 'line-through') {
              elementClicked.style.setProperty('text-decoration', '');
              if (items['ships']) {
                delete items[elementClicked.innerText];
              }
            } else {
              elementClicked.style.setProperty('text-decoration', 'line-through');
              if (!items['ships']) {
                items['ships'] = {};
              }
              items['ships'][elementClicked.innerText] = true;
            }
            chrome.storage.local.set(items);
          });
        });
      }
      if (items['ships'] && items['ships'][element.innerText]) {
        if (element.style.getPropertyValue('text-decoration') != 'line-through') {
          element.style.setProperty('text-decoration', 'line-through');
        }
      } else {
        if (element.style.getPropertyValue('text-decoration') == 'line-through') {
          element.style.setProperty('text-decoration', '');
        }
      }
    });
    setTimeout(myShipsCheck, 5000);
  });
}
myShipsCheck();
