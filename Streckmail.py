# Importera email-moduler
import smtplib, json, getpass, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
from tkinter import Tk
from tkinter.filedialog import askopenfilename

def main():

    loggedIn = False
    while loggedIn == False:
        cid = input("CID: ")
        pw = getpass.getpass(prompt='Lösenord: ')
        print("Följande smeknamn kommer att användas som namn i emailen.")
        name = input("Smeknamn: ")

        # Skapa anslutning med inloggningsuppgifterna
        con = EmailConnection(cid,pw,name)
        loggedIn = con.loggedin

    filepath = None
    while filepath == None:
        root = Tk()
        root.withdraw() # we don't want a full GUI, so keep the root window from appearing
        filepath = askopenfilename(parent=root,initialdir=os.getcwd(),filetypes=(("File","*"),("JSON file","*.json")),title='Välj din streckmailsfil')
        if filepath != None:
            for email in json.load(open(filepath,encoding="utf-8")):
                con.send(email)

        svar = ""
        while svar != "y" and svar != "j" and svar != "n":
            svar = input("Vill du öppna en ny fil? (Y/N)").lower()
        if svar == "y" or svar == "j":
            filepath = None
        else:
            filepath = 1
    con.close()
class EmailConnection():
    def __init__(self,CID,pw,name):
        self.loggedin = False
        self.CID = CID
        LOGIN = CID+"@net.chalmers.se"
        self.pw = pw
        self.name = name
        self.server = {}
        try:
            print("Loggar in som "+CID+"...")
            self.server = smtplib.SMTP("smtp.outlook.com",587)
            self.server.ehlo()
            self.server.starttls()
            self.server.login(LOGIN, self.pw)
            print("Inloggad som "+CID+".")
            self.loggedin = True
        except Exception as e:
            self.loggedin = False
            print("Kunde inte logga in: "+repr(e))

    def send(self,emailObj):
        # Skapa meddelande
        TO = emailObj['email']
        SUBJECT = emailObj['subject']
        MESSAGE = emailObj['message']

        msg = MIMEMultipart() # Skapa email-objekt
        msg['to'] = TO # Till adress
        REPLY = self.CID+"@student.chalmers.se"

        msg['from'] = formataddr((str(Header(self.name, 'utf-8')), REPLY))
        msg['subject'] = Header(SUBJECT, 'utf-8') # Lägg till ämnesrad som utf-8
        msg.add_header('reply-to', REPLY) # Lägg till från-adressen som en reply-to
        msg.attach(MIMEText(MESSAGE,'plain','utf-8')) # Lägg till meddelandet som text

        print("Skickar mail till "+TO+"...")
        try:
            self.server.sendmail(REPLY, TO, msg.as_string())
        except Exception as e:
            print("Kunde inte skicka: "+repr(e))
    def close(self):
        self.server.quit()

if __name__ == "__main__": main()
