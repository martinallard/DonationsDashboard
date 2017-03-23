from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
import os

app = Flask(__name__)

#MONGODB_HOST = 'localhost'
#MONGODB_PORT = 27017
MONGODB_URI = os.getenv("MONGODB_URI")

#DBS_NAME = 'donorsUSA' # what database do i want to connect to. donorsUSA
DBS_NAME =  os.getenv('MONGO_DB_NAME','donorsUSA')

#COLLECTION_NAME = 'projects' # what collection of data do i want within donorsUSA. I want projects
COLLECTION_NAME = os.getenv('MONGO_COLLECTION_NAME','projects')

#Listing fields that you want from database
FIELDS = {'funding_status': True, 'school_state': True, 'resource_type': True, 'poverty_level': True,
          'date_posted': True, 'total_donations': True, 'primary_focus_area': True, '_id': False}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/donorsUS/projects")
def donor_projects():
    #connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    connection = MongoClient(MONGODB_URI)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS, limit=55000)# get the data for the fields specified and limit it to 55000records
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects)
    connection.close()# close database connection
    return json_projects


if __name__ == "__main__":
    app.run(debug=True)
