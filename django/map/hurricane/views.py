from django.http import HttpResponse
from django.db import connection
from django.shortcuts import render
import json
from bs4 import BeautifulSoup
import requests
import pandas as pd
from dateutil.parser import parse
import lxml # used in pands.read_html

def index(request):

    # see if we have a get request
    if request.GET.get('type', False) :
        type = request.GET['type']
        if type == 'plot' :
            return HttpResponse(json.dumps(plot(request)))
        if type == 'update' :
            return HttpResponse(json.dumps(update(request)))
        else :
            return None
    with connection.cursor() as cursor:
        cursor.execute("SELECT SID,SEASON,NUMBER, BASIN, SUBBASIN, NAME, ISO_TIME, NATURE,LAT, LON, WMO_WIND, WMO_PRES, WMO_AGENCY, TRACK_TYPE, DIST2LAND,LANDFALL from hurricanes limit 10")
        results = cursor.fetchall()

    with connection.cursor() as cursor:
        cursor.execute("select distinct SID, NAME, SUBBASIN, YEAR(CAST(ISO_TIME as date)) as YEAR from hurricanes where NAME not in ('', 'NOT_NAMED') order by NAME")
        names = cursor.fetchall()

    return render(request, 'index.html', {
                'hurricanes': results,
                'names': names,
    })

def plot(request):
    with connection.cursor() as cursor:
        cursor.execute(f"select SID, NAME, ISO_TIME, LAT, LON, WMO_WIND, WMO_PRES from hurricanes where SID = '{request.GET['SID']}' order by ISO_TIME")
        entries = cursor.fetchall()
    results = {
        'lat' : [],
        'lon' : [],
        'wind' : [],
        'pressure' : []
    }
    for entry in entries :
        results['lat'].append(entry[3])
        results['lon'].append(entry[4])
        results['wind'].append(entry[5])
        results['pressure'].append(entry[6])

    return results
def update(request):
    '''
    Updates the database with the live data available from the
    Regional and Mesoscale Meteorology Branch (RAMMB).
    '''
    config = {
        'url': 'http://rammb-data.cira.colostate.edu/tc_realtime/',
        'ir_img_url': 'http://rammb-data.cira.colostate.edu/tc_realtime/archive.asp?product=4kmirimg&storm_identifier=',
        'base_url': 'http://rammb-data.cira.colostate.edu'
    }

    page = requests.get(config['url'])

    soup = BeautifulSoup(page.text, 'html.parser')

    soup.find(class_='basin_storms')

    data = soup.findAll('div', attrs={'class': 'basin_storms'})
    storms = []
    for div in data:
        links = div.findAll('a')
        for a in links:
            storm = {
                'id': a.text[:8],
                'url': config['url'] + a['href'],
                'img_url': config['ir_img_url'] + a.text[:8].lower(),
            }
            print(f'[id]: {storm["id"]}')
            print(f'[url]: {storm["url"]}')
            print(f'[img_url]: {storm["img_url"]}')

            # get dataframe from url
            current_page = requests.get(storm['url'])
            current_soup = BeautifulSoup(current_page.text, 'html.parser')
            tables = current_soup.findAll('table')

            # we manually input the table names because they're the same
            # for every storm
            has_forecast = len(tables) > 1
            storm['data'] = {
                'forecast_track': pd.read_html(str(tables[0]))[0] if has_forecast else None,
                'track_history': pd.read_html(str(tables[1]))[0] if has_forecast else pd.read_html(str(tables[0]))[0]
            }
            print(f'[track_history] : {storm["data"]["track_history"]}')
            print(f'[forecast_track] : {storm["data"]["forecast_track"]}')

            # begin getting img url links
            current_page = requests.get(storm['img_url'])
            current_soup = BeautifulSoup(current_page.text, 'html.parser')
            img_urls = [config['base_url'] + img_href['href'] for img_href in
                        current_soup.findAll('table')[0].findAll('a')]
            storm['img_urls'] = img_urls
            print(f'[1st img_url]: {storm["img_urls"][0]}')
            storms.append(storm)

    # Iterate through storms and populate data
    for storm in storms:
        id = storm['id']
        history = storm['data']['track_history']
        # create the queries to be executed
        queries = [f'''
            REPLACE INTO hurricane_live
            VALUES ('{id}', '{parse(time).isoformat()}', '{lat}', '{lon}', '{ins}');
            ''' for time, lat, lon, ins in zip(history[0][1:], history[1][1:], history[2][1:], history[3][1:])]

        with connection.cursor() as cursor:
            # delete all previous data
            cursor.execute('DELETE FROM hurricane_live;')
            # do insert queries
            for query in queries:
                cursor.execute(query)

    return storms
