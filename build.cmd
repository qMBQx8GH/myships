cd src
del myShips.zip
"C:\Program Files\7-Zip\7z.exe" a -r myShips.zip myShips
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --pack-extension=c:\src\myShips\src\myShips --pack-extension-key=c:\src\myShips\src\myShips.pem
