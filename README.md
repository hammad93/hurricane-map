# hurricane map
A graphical user interface through a web application is created to display archived tropical storms and forecast models.

## Quickstart
```
 python3 manage.py runserver 0.0.0.0:7000
```
This repository uses Django to serve the hurricane artificial intelligence.

This repository is also setup using a SQL database which is configured with keys unavailable from the public git repository. However, it can run on any other SQL database with the same data structure.

### SystemD Service File

Use the commands `systemctl status fluids` or `systemctl restart fluids` for management of the daemon.

```commandline
[Unit]
Description=Runs the Django mapping service

[Service]
Type=simple
User=bitnami
ExecStart=/usr/bin/python3 /opt/bitnami/apps/wordpress/htdocs/map/hurricane-map/django/map/manage.py runserver 0.0.0.0:7000
Restart=always
StandardOutput=file:/home/bitnami/fluids.log

[Install]
WantedBy=multi-user.target```