from django.http import HttpResponse
from django.db import connection
from django.shortcuts import render

def index(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT SID,SEASON,NUMBER, BASIN, SUBBASIN, NAME, ISO_TIME, NATURE,LAT, LON, WMO_WIND, WMO_PRES, WMO_AGENCY, TRACK_TYPE, DIST2LAND,LANDFALL from hurricanes limit 10")
        results = cursor.fetchall()

    return render(request, 'index.html', {
                'hurricanes': results,
    })

