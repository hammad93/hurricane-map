from django.http import HttpResponse
from django.db import connection
from django.shortcuts import render

def index(request):

    # see if we have a get request
    if request.GET.get('type', False) :
        type = request.GET['type']
        if type == 'plot' :
            return plot(request)
        else :
            return None
    with connection.cursor() as cursor:
        cursor.execute("SELECT SID,SEASON,NUMBER, BASIN, SUBBASIN, NAME, ISO_TIME, NATURE,LAT, LON, WMO_WIND, WMO_PRES, WMO_AGENCY, TRACK_TYPE, DIST2LAND,LANDFALL from hurricanes limit 10")
        results = cursor.fetchall()

    with connection.cursor() as cursor:
        cursor.execute("select distinct SID, NAME from hurricanes where NAME not in ('', 'NOT_NAMED') order by NAME")
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
        ['lat'] : [],
        ['lon'] : [],
        ['wind'] : [],
        ['pressure'] : []
    }
    for entry in entries :
        results['lat'].append(entry[3])
        results['lon'].append(entry[4])
        results['wind'].append(entry[5])
        results['pressure'].append(entry[6])

    return results