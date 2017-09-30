# Strecklista
Digital strecklista som webapp för simpel hantering av streckvaror

## App Features
* PIN-protected (no tedious personal logins)
* Save user as favourite to show at the top of the users list
* Live feed of transactions
* Swish into your account directly from the app
* Admin can send account balance emails in the app

## Technical Features
* Device agnostic
* No extra hardware required
* Google Sheet as database for easy handling (for the admin)
* No cost at all!

# Installation
## Requirements
* Google account (with Sheets language set as Swedish)
* Heroku account
* No previous coding experience!
* Some knowledge of Google Sheets / Excel

## Create database server (Google Sheet)
First you will make a database Sheet from a template and enable it for web requests.
1. Go to [this Google Sheet](https://docs.google.com/spreadsheets/d/1gPa05XEx8V-suxmafw6fqGoaCoEWWZ85tGntNz_isi8/edit?usp=sharing "Database template Sheet").
2. Make a copy to your own Drive by clicking **Arkiv** -> **Kopiera...**. Give it a good name and place it in an empty folder where you can find it later.
3. Open the Sheet and then click the menu item **Verktyg** -> **Skriptredigerare...**.
4. In the new tab click the menu item **Publicera** -> **Implementera som webapp...**.
5. Another window will open. Select the following settings below and then click **Implementera**. Close the tab and go back to the Sheet.
![Settings for web app](https://user-images.githubusercontent.com/28558941/31039466-2801704a-a57e-11e7-8a22-9e065e223bb0.png "Settings for web app")

## Deploy web app to Heroku
1. Now click the menu item **Admin** -> **Skapa ny webapp (Heroku)**.
2. Click **Fortsätt** if it says *Behörighet krävs* and then select your Google account.
3. It will say that the app is not verified. This is OK. Click **Avancerat** and then click **Öppna Strecklista (osäkert)**. Click confirm on any remaining dialog windows.
4. Finally a press the button that says *Deploy to Heroku*.
5. After you have signed in a dialog for deploying the app is shown. The name will be the URL of your web app, for example if you choose *min-strecklista* as the name the URL will be <https://min-strecklista.herokuapp.com>. Choose something descriptive, but still memorable and short. Choose *Europe* as region and then click **Deploy app**.
 ![Create new app](https://user-images.githubusercontent.com/28558941/31044962-f0d77900-a5d9-11e7-95e7-ce94697220ba.png "Create new app")
6. Done!
