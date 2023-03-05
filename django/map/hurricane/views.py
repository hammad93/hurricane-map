from django.http import HttpResponse
from django.db import connection
from django.shortcuts import render
import json
import requests

def index(request):
    '''
    This function returns the home page or index. Not only does it contain HTML, it
    also contains variables that are relevant to the mapping algorithms.
    '''
    # get historical records
    with connection.cursor() as cursor:
        # this query is slightly more efficient than a select *
        cursor.execute("select distinct SID, NAME, SUBBASIN, YEAR(CAST(ISO_TIME as date)) as YEAR from hurricanes where NAME not in ('', 'NOT_NAMED') order by NAME")
        hurricanes = cursor.fetchall()
    
    # get live records of global tropical storms
    with connection.cursor() as cursor:
        cursor.execute("select * from hurricane_live")
        live_storms = cursor.fetchall()
    
    return render(request, 'index.html', {
                'hurricanes': hurricanes,
                'live_storms': live_storms
    })
