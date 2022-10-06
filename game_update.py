# -*- coding: utf-8 -*-

import os
import io
import sys
import zlib
import json
import pickle
import gettext
import roman
import subprocess
import xml.etree.ElementTree as ET
import configparser

config = configparser.ConfigParser()
config.read('build.ini')
path_to_game = config['Game']['folder']

xml_root = ET.parse(os.path.join(path_to_game, 'game_info.xml'))
xml_version = xml_root.findall(".//version[@name='client']")
version = xml_version[0].attrib['installed']

class MyTranslation(gettext.GNUTranslations):
   def __init__(self, fp=None):
        super(MyTranslation, self).__init__()
        self._charset = 'UTF-8'
        if fp is not None:
            self._parse(fp)

tr = {
    'ru': gettext.translation('global', os.path.join(path_to_game, 'bin', version.split(".")[-1], 'res/texts'), ['ru'], class_=MyTranslation),
    'en': gettext.translation('global', os.path.join(path_to_game, 'bin', version.split(".")[-1], 'res/texts'), ['en'], class_=MyTranslation),
}

content = [
    'content/GameParams.data',
]
for d in content:
    subprocess.run([
        'wowsunpack.exe',
        '-x', os.path.join(path_to_game, "bin", version.split(".")[-1], "idx"),
        '-I', d,
        '-p', '..\\..\\..\\res_packages',
        '-o', 'res',
    ],
        shell=True,
    )
    print(d, 'OK')

with open('res/content/GameParams.data', 'rb') as f:
    b = io.BytesIO()
    b.write(f.read()[::-1])
    b.seek(0)

z = zlib.decompress(b.read())
d = pickle.loads(z)

ships = []
for key, value in d[0].items():
    if value.typeinfo.type == 'Ship':
        level = roman.toRoman(value.level)
        en = (level + ' ' + tr['en'].gettext('IDS_' + value.index)).upper()
        en_full = (level + ' ' + tr['en'].gettext('IDS_' + value.index + '_FULL')).upper()
        ru = (level + ' ' + tr['ru'].gettext('IDS_' + value.index)).upper()
        ru_full = (level + ' ' + tr['ru'].gettext('IDS_' + value.index + '_FULL')).upper()
        search = list(set([
            en, en_full, ru, ru_full
        ]))
        search.sort()
        ships.append({
            'index': value.index,
            'id': value.id,
            'en': tr['en'].gettext('IDS_' + value.index),
            'ru': tr['ru'].gettext('IDS_' + value.index),
            'nation': value.typeinfo.nation,
            'level': value.level,
            'species': value.typeinfo.species,
            'group': value.group,
            'search': search,
        })

nations = {
    'Japan': 10,
    'USA': 20,
    'Russia': 30,
    'Germany': 40,
    'United_Kingdom': 50,
    'France': 60,
    'Italy': 70,
    'Pan_Asia': 80,
    'Europe': 90,
    'Netherlands': 100,
    'Commonwealth': 110,
    'Pan_America': 120,
    'Spain': 130,
    'Events': 200,
}
species = {
    'Destroyer': 10,
    'Cruiser': 20,
    'Battleship': 30,
    'AirCarrier': 40,
    'Submarine': 50,
    'Auxiliary': 100,
}

ships.sort(key=lambda k: (k['level'], nations[k['nation']], species[k['species']], k['en']))
with open('src/myShips/ships.json', 'w', encoding='utf-8') as f:
    json.dump(ships, f, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)

for lang in ['en', 'ru']:
    with open('src/myShips/_locales/'+lang+'/messages.json', 'r', encoding='utf-8') as f:
        messages = json.load(f)
    for key, value in d[0].items():
        if value.typeinfo.type == 'Ship':
            messages['IDS_' + value.index] = {
                'message': tr[lang].gettext('IDS_' + value.index),
            }
    with open('src/myShips/_locales/'+lang+'/messages.json', 'w', encoding='utf-8') as f:
        json.dump(messages, f, sort_keys=True, indent=2, separators=(',', ': '), ensure_ascii=False)

sys.exit(0)

def stringify_keys(d):
    """Convert a dict's keys to strings if they are not."""
    for key in d.keys():
        # check inner dict
        if isinstance(d[key], dict):
            value = stringify_keys(d[key])
        else:
            value = d[key]
        # convert nonstring to string if needed
        if not isinstance(key, str):
            try:
                d[str(key)] = value
            except Exception:
                try:
                    d[repr(key)] = value
                except Exception:
                    raise
            # delete old key
            del d[key]
    return d

class GPEncode(json.JSONEncoder):
    def default(self, o):
        if hasattr(o, '__dict__'):
            return stringify_keys(o.__dict__)
        else:
            return None

with open('tmp/GameParams.json', 'w') as f:
    f.write(json.dumps(d, cls=GPEncode, indent=4, separators=(',', ': '), ensure_ascii=False))
