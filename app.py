#! usr/bin/python 
# -*- coding: utf-8 -*- 
from flask import render_template
from flask import flash, redirect, request, session, abort
import os
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps
from flask import Flask

import math
from textblob import TextBlob as tb

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'test'
COLLECTION_NAME = 'projects'
FIELDS = {'Skill_level': True, 'Job': True, 'Year': True, 'Offer': True, 'Job': True, 'Experience': True, 'Average_salary_ranges': True, 'Regions': True, '_id': False}
FIELDS1 = {'Savoir': True, 'Savoir_Etre': True, 'Savoir_faire': True}


limit_count = 1000

def tf(word, blob):
    if len(blob.words) == 0:
        return 0
    return blob.words.count(word) / len(blob.words)

def n_containing(word, bloblist):
    return sum(1 for blob in bloblist if word in blob.words)

def idf(word, bloblist):
    return math.log(len(bloblist) / (1 + n_containing(word, bloblist)))

def tfidf(word, blob, bloblist):
    return tf(word, blob) * idf(word, bloblist)

def bExist(word, blob):
    if word in blob.words:
        return 1
    else:
        return 0


# define the methods to get the projects and skills
@app.route('/')
def home():
    #if not session.get('logged_in'):
    #    return render_template('login.html')
    #else:
    return render_template('home.html')

@app.route('/', methods=['POST'])
def run():
    #run the functions
    return render_template('home.html')


@app.route('/login', methods=['POST'])
def do_admin_login():
    if request.form['password'] == 'password' and request.form['username'] == 'admin':
        session['logged_in'] = True
        return render_template('AddSkill.html')
    else:
        flash('wrong password!')
    return home()

@app.route("/logout")
def logout():
    session['logged_in'] = False
    return home()

@app.route('/AddSkill.html')
def add_skill_open():
    if not session.get('logged_in'):
        return render_template('login.html')
    else:
        return render_template('AddSkill.html')

@app.route('/addSkill', methods=['POST'])
def AddSkill():
    #add skill to mongo db
    client = MongoClient(MONGODB_HOST, MONGODB_PORT)
    skills = client["savoir"]["skills"]
    
    if  request.form['savoir'] == '' and request.form['savoir_faire'] == '' and request.form['savoir_etre'] == '':
        flash('Fill the blanks')
    else:
        msg = ""
        rec = {}
        binsert = 0
        if request.form['savoir'] != "":
            if  skills.find_one({"Savoir": request.form['savoir']}) is None:
                rec["Savoir"] = request.form['savoir']
                binsert = 1
                msg = " Savoir ajoute. "
            else:
                msg = " Savoir existe dans la base de bonnees. "
        if request.form['savoir_faire'] != "":
            if skills.find_one({"Savoir_faire": request.form['savoir_faire']}) is None:
                rec["Savoir_faire"] = request.form['savoir_faire']
                binsert = 1
                msg += " Savoir_faire ajoute. "
            else:
                msg += " Savoir_faire existe dans la base de bonnees. "
        if request.form['savoir_etre'] != "":
            if skills.find_one({"Savoir_Etre": request.form['savoir_etre']}) is None:
                rec["Savoir_Etre"] = request.form['savoir_etre']
                binsert = 1
                msg += " Savoir_Etre ajoute. "
            else:
                msg += " Savoir_Etre existe dans la base de bonnees. "
        if binsert == 1:
            rec_id = skills.insert_one(rec)
        flash(msg)
    return render_template('AddSkill.html')

@app.route("/test/projects1")
def donorschoose_projects1():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS)
    json_projects1 = []
    for project in projects:
        json_projects1.append(project)
    json_projects1 = json.dumps(json_projects1, default=json_util.default)
    connection.close()
    return json_projects1

@app.route("/test/projects2")
def donorschoose_projects2():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS)

    collection1 = connection["savoir"]["skills"]
    projects1 = collection1.find(projection=FIELDS1)

    collection2 = connection[DBS_NAME][COLLECTION_NAME]
    projects2 = collection2.find(projection=FIELDS)

    json_projects2 = []
    documents = []
    skills = []
    c = 1
    for project in projects2:
        documents.append(tb(project['Offer']))
        c += 1
        if c > limit_count:
           break

    for skill in projects1:
        if skill['Savoir'] != "":
            skills.append(skill['Savoir']) #Ajout d'une compétence à la liste
        if skill['Savoir_Etre'] != "":
            skills.append(skill['Savoir_Etre'])
        if skill['Savoir_faire'] != "":
            skills.append(skill['Savoir_faire'])
    ind = 0
    for project in projects:
        if ind >= limit_count:
           break
        for skill in skills:
            abc = tfidf(skill, documents[ind], documents)   #Calacul de la TF IDF 
            project[skill] = abc
        ind += 1
        print(str(ind) + ": done")
        json_projects2.append(project)       

    json_projects2 = json.dumps(json_projects2, default=json_util.default)
    connection.close()
    print("---- projects returned ;")
    return json_projects2

@app.route("/test/projects3")
def donorschoose_projects3():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS)

    collection1 = connection["savoir"]["skills"]
    projects1 = collection1.find(projection=FIELDS1)

    collection2 = connection[DBS_NAME][COLLECTION_NAME]
    projects2 = collection2.find(projection=FIELDS)

    json_projects3 = []
    documents = []
    skills = []
    c = 1
    for project in projects2:
        documents.append(tb(project['Offer']))
        c += 1
        if c > limit_count:
            break

    for skill in projects1:
        if skill['Savoir'] != "":
            skills.append(skill['Savoir'])
        if skill['Savoir_Etre'] != "":
            skills.append(skill['Savoir_Etre'])
        if skill['Savoir_faire'] != "":
            skills.append(skill['Savoir_faire'])
    ind = 0
    for project in projects:
        if ind >= limit_count:
            break
        for skill in skills:
            # abc = tfidf(skill, documents[ind], documents)
            abc = bExist(skill, documents[ind])
            project[skill] = abc
        ind += 1
        print(str(ind) + ": done")
        json_projects3.append(project)

    json_projects3 = json.dumps(json_projects3, default=json_util.default)
    connection.close()
    print("---- projects returned ;")
    return json_projects3

@app.route("/savoir/skills")
def sill_projects():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection["savoir"]["skills"]
    projects = collection.find(projection=FIELDS1)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

if __name__ == "__main__":
    app.secret_key = os.urandom(12)
    app.run(debug=True)