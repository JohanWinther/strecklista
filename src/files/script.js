// Sätt globala variabler (dessa hamnar under window)
var url = "https://script.google.com/macros/s/AKfycbyDpQHQEKC8tSNVhGdn5aaZNo2LklBmh7q7nGf5cD_C/dev";

var state = {};
var email_str = "";
var emailIdx = 0;

$(function() {
    // Detta körs när sidan är klar för att manipuleras

    // Kolla om Sheet ID från config.js har laddats
    if (sheetID=="") {
        $("#loadMsg").html("Till admin: kör Setup.py innan du använder webbsidan!");
    } else {
        window.sheetURL = 'https://docs.google.com/spreadsheets/d/'+sheetID+'/';
        pageName = document.location.href.match(/[^\/]+$/);
        if (pageName == null){
            pageName = "index.html";
        } else {
            pageName = pageName[0];
        }
        if (pageName=="admin.html") {
            // Ändra länken på adminsidan
            $("#sheetLink").attr("href",sheetURL);
        } else {
            // Ladda strecklistan om nuvarande sida är index.html (på en webbserver kanske inte index.html syns så därför används bara else)
            // getJSON skickar en JSONP request med vissa parameterar och kör sedan funktionen i .done() med 'data' som objekt
            $.getJSON(url+"?sheetID="+sheetID+"&prefix=createTable&callback=?")
            .done(function(data) {
                $('.list').html(createTable(data));
            });
        }
    }

    // Skapa strecklista
    function createTable(data) {
        var html = '';
        var group = data.groups;
        var members = data.members;
        var buttons = data.buttons;
        // Skapa table
        html += '<table class="tg">';
        html += '<tbody id="tableBody">';

        // Loopa igenom varje grupp
        for (g in group) {
            html += '<tr>';
            html += '<th colspan='+(buttons.length+2)+'>';
            html += group[g];
            html += '</th>';
            // Loopa igenom varje person
            for (m in members[g]) {
                html += '<tr>';
                html += '<td>';
                member = members[g][m].split(";");
                cid = member[0];
                name = member[1];
                html += name;
                html += '</td>';
                for (b in buttons) {
                    html += '<td class="table-button">';
                    html += '<div class="round-button-circle">';
                    html += '<a onclick="pay.call(this,\'';
                    html += cid
                    html += '\',';
                    html += "'"+buttons[b]+"'";
                    html += ')" class="round-button">';
                    html += buttons[b];
                    html += '</a></div></td>';
                }
                html += '<td>'
                html += '<input type="number" class="num-input"></input>';
                html += '<div class="round-button-circle round-left">';
                html += '<a onclick="payVal.call(this,\'';
                html += cid
                html += '\')" class="round-button">';
                html += "&#x25ba";
                html += '</a></div></td>';
                html += '</tr>';
            }
        }
        html += '</tbody>';
        html += '</table>';

        // Returnera tabell som html
        return html;
    }
});

function adminLogin() {
    $("#loginErr").html("Loggar in..");
    $("#loginBtn").removeAttr("onclick");
    $("#loginBtn").prop('disabled', true);
    $.getJSON(url+"?sheetID="+sheetID+"&prefix=adminLogin&callback=?",
    function(data) {
        if ($('#password').val()==data.password) {
            $('.list').html(createAdminPage(data.mail_pw));
        } else {
            $('#loginErr').html("Fel lösenord.")
            $("#loginBtn").attr("onclick","adminLogin()");
            $("#loginBtn").prop('disabled', false);
        }
    });

    function createAdminPage(mail_pw) {
        var html = '';
        html += '<div class="settings">';
        html += '<h1>Administration</h1>';
        html += '<p><a href="';
        html += sheetURL;
        html += '" target="_blank">Avancerade inställningar (Google sheet)</a></p>';
        html += '<h2>Streckmail</h2>';
        html += '<h3>Användaruppgifter för mailkonto</h3>';
        html += 'Användarnamn: <br><span class="info">ftek-streckning@outlook.com</span><br>Lösenord:<br><span class="info">'+mail_pw+'</span>';
        html += '<p><a href="https://outlook.live.com/" target="_blank" >Logga in i Outlook</a><p>';
        html += '<h3>Skicka streckmail</h3>'
        html += '<input type="submit" id="fileBtn" onclick="createFile()" value="Skapa streckmailsfil" />';
        html += '<p><a href="#" id="fileLink" download="emails.txt" target="_blank" ="Högerklicka och Spara som..."></a></p>';
        html += '<input type="submit" id="sendBtn" onclick="sendEmails()" value="Skicka streckmail nu" /><span> (via ftek-streckning@outlook.com)</span>';
        html += '<p id="sendMessage"></p>';
        html += '<ol id="emailList"></ol>';
        html += '</div>';
        return html;
    }
}

function createFile() {
    $("#fileBtn").attr("value","Skapar fil...");
    $("#fileBtn").removeAttr("onclick");
    $("#fileBtn").prop('disabled', true);
    $.getJSON(url+"?"+"sheetID="+sheetID+"&prefix=sendEmail&callback=?",
    function (data) {
        var str = JSON.stringify(data);
        var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(str);
        var link = document.getElementById('fileLink').href = dataUri;
        $("#fileLink").html("emails.txt");
        $("#fileBtn").attr("onclick","createFile()");
        $("#fileBtn").prop('disabled', false);
        $("#fileBtn").attr("value","Skapa streckmailsfil");
    });
}


function sendEmails() {
    // Definiera mailfunktionen
    function sendEmail(mail_from,to,subject,message,mail_pw,emailID) {
        var h = Math.floor(1e6 * Math.random() + 1)
        var i = "https://smtpjs.com/smtp.aspx?";
        i += "From=" + mail_from,
        i += "&to=" + to,
        i += "&Subject=" + encodeURIComponent(subject),
        i += "&Body=" + encodeURIComponent(message),

        i += "&Host=" + "smtp-mail.outlook.com",
        i += "&Username=" + encodeURIComponent("ftek-streckning@outlook.com"),
        i += "&Password=" + encodeURIComponent(mail_pw),
        i += "&Action=Send",
        i += "&cachebuster=" + h,
        $.get(i)
        .fail(function(data) {
            console.log("Request error (missing values in parameters?)");
            console.log(data);
            $("#"+emailID).html("- Fel... kolla JavaScript-logg");
        })
        .done(function(data) {
            console.log(data);
            if (data=="OK") {
                $("#"+emailID).html("- Klar!");
            } else {
                $("#"+emailID).html("- Försöker igen...");
                sendEmail(mail_from,to,subject,message,mail_pw,emailID)
            }
        });
    }

    $("#sendMessage").html("Skickar mail..");
    $("#emailList").html("");
    $("#sendBtn").removeAttr("onclick");
    $("#sendBtn").prop('disabled', true);
    $.getJSON(url+"?"+"sheetID="+sheetID+"&prefix=sendEmail&callback=?",
    function (data) {
        email_str = ""
        emailIdx = 0;
        mail_from = data.mail_from // Definieras utanför loopen
        mail_pw = data.mail_pw // Definieras utanför loopen
        for (e in data.emails) {
            if (data.emails[e].email!="") {
                console.log(data.emails[e].email);
                $("#sendMessage").html("Skickar mail..");
                emailID = "email"+emailIdx;
                email_str += '<li><a href="mailto:'+data.emails[e].email+'" target="_blank">'+data.emails[e].email+'</a> <span id="'+emailID+'"> - Skickar...</span></li>';
                sendEmail(mail_from,data.emails[e].email,data.emails[e].subject,data.emails[e].message,mail_pw,emailID);
                emailIdx++;
            }
        }
        if (email_str=="") {
            $("#sendMessage").html("Inga mail skickade.");
        } else {
            $("#emailList").html(email_str);
        }
    });
    $(document).ajaxStop(function() {
        if (email_str!="") {
            $("#sendMessage").html("Skickade till följande:<br><a href=\"#\" id='hideLink' onclick='hideEmailList()' >Göm</a>");
        }
        $("#sendBtn").attr("onclick","sendEmails()");
        $("#sendBtn").prop('disabled', false);
    });
}

function hideEmailList() {
    if ($("#hideLink").html()=="Göm") {
        $("#hideLink").html("Visa");
        $("#emailList").css("display","none");
    } else {
        $("#hideLink").html("Göm");
        $("#emailList").removeAttr("style");
    }
}

var pay = function(cid,amount) {
    a = $(this);
    amount = parseFloat(amount);
    if (!isNaN(amount)) {
        if (!(cid in state)) {
            a.parent().addClass("round-loading");
            state[cid] = 1;
            change = -amount;
            sendPayment(cid,change,'SP','',a);
        }
    } else {
        alert("Knappen är inte ett tal!");
    }
}
var payVal = function(cid,plus) {

    function askForComment() {
        a.parent().parent().children()[0].value = round(parseFloat(a.parent().parent().children()[0].value),2);
        name = a.parent().parent().siblings().first().html();
        html = '';
        html += '<tr id="plus-box"><td colspan="'+$("#tableBody").children()[0].cells[0].colSpan+'" class="commentRow">';
        html += '<div class="left-box-plus"><p><select id="selectionBox"><option value="Makulering">Ångra </option>';
        html += '<option value="Plussning">Plussa </option></select> ';
        html += '<input type="number" name="amount" id="plus-amount" min="1" value="'+Math.abs(parseFloat(a.parent().parent().children()[0].value))+'" /> kr på '+name+'.</p>';
        html += '<p>Kommentar:<br><input type="text" name="comment" id="comment" /></p></div>';
        html += '<div class="confirmBox">';
        html += '<div class="round-button-circle cross" id="currentCheck"><a onclick="payVal.call(this,\''+cid+'\',1)" class="round-button">+</a></div>';
        html += '<div class="round-button-circle cross" id="currentCross"><a onclick="closeCommentBox.call(this);';
        html += '" class="round-button">&times;</a></div>';
        html += '</div></td></tr>';
        a.parent().attr('id', 'currentPlus');
        a.parent().css("display","none");
        a.parent().parent().parent().after(html);
    }

    a = $(this);
    if (!(cid in state)) {
        if (plus) {
            amount = round(-Math.abs(parseFloat($("#plus-amount").val())),2);
            $("#plus-amount").val(-amount);
            $("#currentPlus").prev().val(amount)
            category = $('select#selectionBox').val();
            comment = $("#comment").val();
        } else {
            amount = round(parseFloat(a.parent().parent().children()[0].value),2);
            category = "SP";
            comment = "";
        }
        if (!isNaN(amount)) {
            if (amount<0 && !plus) {
                closeCommentBox();
                askForComment();
            } else {
                a.parent().addClass("round-loading");
                $("#currentCross").css("display","none");
                state[cid] = 1;
                change = -amount;
                sendPayment(cid,change,category,comment,a);
                if (plus) {
                    setTimeout(function(){closeCommentBox()},5000);
                }
            }
        } else {
            alert("Skriv in ett tal!");
        }
    }
}

function sendPayment(cid,change,category,comment,self) {
    $.getJSON(url+"?"+"cid="+cid+"&change="+change+"&category="+category+"&comment="+comment+"&sheetID="+sheetID+"&prefix=postPayment&callback=?",
    function (data) {
        self.parent().removeClass("round-loading");
        success = data.success;
        if (success) {
            flashColor(self,"green");
            console.log(cid+" har ändrats med "+change+" kr. Nu: "+data.current+" kr.");
            if (data.current <= 0) {
                console.log(cid+" har "+(-data.current)+" kr i skuld!");
            } else if (data.current <=10) {
                console.log(cid+" har endast "+(data.current)+" kr kvar att strecka på!");
            }
        } else {
            flashColor(self,"red");
            if (change<0) {
                console.log("Kunde inte strecka "+(-change)+"kr på "+cid+": "+data.message);
            } else {
                alert("Kunde inte lägga till "+change+"kr på "+cid+": "+data.message);
            }
        }
        $("#currentCross").removeAttr("style");
        delete state[cid];
    });
}

function flashColor(el,color) {
    var cell = el.parent().parent();
    var row = el.parent().parent().parent();
    row.css("transition","");
    row.css("transition");
    row.css("background",color);
    row.css("background");
    if (color == "red") {
        row.css("transition","background 15s");
    } else {
        row.css("transition","background 2s");
    }
    row.css("transition");
    row.css("background","");
    cell.css("transition","");
    cell.css("transition");
    cell.css("background",color);
    cell.css("background");
    cell.css("transition","background 10s");
    cell.css("transition");
    cell.css("background","");
}

function closeCommentBox() {
    $('#currentPlus').removeAttr('style');
    $('#currentPlus').removeAttr('id');
    $('#plus-box').remove();
}

function round(number, decimals) { return +(Math.round(number + "e+" + decimals) + "e-" + decimals); }
