import os, re, webbrowser
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from time import sleep
from shutil import copy2

def main():
    print("Välkommen till installationen av din strecklista!")
    print("")
    svar = ""
    while svar != "y" and svar != "j" and svar != "n":
        svar = input("Vill du köra hela installationen? Det är rekommenderat om det är första gången du kör. (Y/N): ").lower()
    if svar == "y" or svar == "j":
        print("")
        print("För att allt ska bli rätt måste du fullfölja alla steg.")
        sleep(2)
        print("Du kan alltid köra denna installation igen om något skulle gå fel utan att förlora redan sparad data.")
        print("")
        sleep(4)
        addName()
        sleep(2)
        addSheet()
        sleep(2)
        print("")
        print("Nu är det dags att lägga till en logga (frivilligt, men snyggare).")
        sleep(2)
        addLogo()
        sleep(2)
        print("")
        input("Installationen är nu klar! Tryck Enter för att stänga..")

    else:

        print("Vad vill du göra?")
        print("Välj någon av dessa:")
        print("- Lägga till en Google Sheet (sheet)")
        print("- Lägga till logga (logga)")
        print("- Byt namn på strecklista (namn)")

        while True:
            svar = ""
            while svar != "sheet" and svar != "logga" and svar != "namn" and svar != "exit":
                svar = input("Välj ett kommando (sheet/logga/namn/exit): ").lower()
            if svar == "sheet":
                addSheet()
            elif svar == "logga":
                addLogo()
            elif svar == "namn":
                addName()
            elif svar == "exit":
                break

# Lägg till Google Sheet
def addSheet():
    print("En Google Sheet kommer att öppnas i din webbläsare.")
    sleep(2)
    print("Kopiera den till din egen Drive genom att klicka File -> Make a Copy.")
    sleep(4)
    print("Spara den på ett bra ställe där bara du har tillgång till den. Du kan alltid flytta den senare.")
    sleep(5)
    input("Tryck Enter för att öppna Google sheet..")
    webbrowser.open('https://docs.google.com/spreadsheets/d/1gPa05XEx8V-suxmafw6fqGoaCoEWWZ85tGntNz_isi8/edit?usp=sharing')
    sleep(2)
    input("Tryck Enter när du har gjort en kopia till din egna Drive..")

    # SheetURL från Streckning.gsheet
    sheetID = None
    while sheetID == None:
        print("Klistra in länken till din nya Google Sheet.")
        sheetURL = input("(Om ctrl-v inte funkar, högerklicka på fönstrets topp och leta efter 'Paste'): ")
        sheetID=re.search('\/d\/([^\/]+)\/',sheetURL).group(1)
        if sheetID==None:
            print("Fel vid tolkning av länk. Försök igen.")
            sleep(2)

    writingConfig = True
    while writingConfig:
        # Skriv till config.js
        try:
            changeConfig("sheetID",sheetID)
            writingConfig = False
        except Exception as e:
            print("Lyckades inte skriva till konfigurationsfilen: "+repr(e))
            sleep(4)
            input("Var vänlig stäng ner möjliga program som kan ha \"src/files/config.js\" öppen och klicka sedan på Enter för att försöka igen..")
    print("Google sheet tillagt!")
    print("")
def addLogo():
    root = Tk()
    root.withdraw() # we don't want a full GUI, so keep the root window from appearing
    myFile = askopenfilename(parent=root,filetypes=[("PNG","*.png")],title='Välj din logga')
    if myFile != "":
        counter = 1
        while counter < 3:
            try:
                os.remove("src/files/logo.png")
                print("Tar bort 'logo.png'..")
            except OSError:
                pass
            print("Lägger in '"+myFile+"' som 'logo.png'...")
            sleep(3)
            try:
                copy2(myFile, "src/files/logo.png")
                print("Logga tillagd!")
                counter = 3
            except Exception as e:
                print("Kunde inte lägga till logga: "+repr(e))
                counter+=1
                if counter < 3:
                    print("Försöker igen.. ("+counter+"/3)")
                else:
                    print("För många försök. Avbryter.")
    else:
        print("Ingen logga tillagd!")
        print("")
def addName():
    name = ""
    while name == "":
        name = input("Strecklistans namn? (t.ex. Strecklista Kommitté): ")

    changeConfig("title",name)
    changeManifest(name)
    print("Strecklista döpt till: "+name)
    print("")

def changeConfig(var,value):
    with open('src/files/config.js') as configFile:
        configFile=configFile.readlines()
    f = open('src/files/config.js', 'w',encoding="utf-8")
    if var == "title":
        f.write(configFile[0])
        f.write('document.title = "'+value+'";')
        f.close()
    elif var == "sheetID":
        f.write('sheetID = "'+value+'";\n')
        f.write(configFile[1])
        f.close()
def changeManifest(value):
    with open('src/manifest.json') as manifestFile:
        manifestFile=manifestFile.readlines()
    manifestFile[1] = '    \"name\": "'+value+'",\n'
    f = open('src/manifest.json', 'w',encoding="utf-8")
    f.writelines(manifestFile)
    f.close()

main()
