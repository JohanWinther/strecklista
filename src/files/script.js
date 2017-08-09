// Sätt globala variabler (dessa hamnar under window)


var state = {};
var email_str = "";
var emailIdx = 0;

$(function() {
    // Detta körs när sidan är klar för att manipuleras

    // Kolla om Sheet ID från config.js har laddats
    if (macroURL=="") {
        $("#loadMsg").html("Till admin: kör Setup.py innan du använder webbsidan!");
    } else {
        pageName = document.location.href.match(/[^\/]+$/);
        if (pageName == null){
            pageName = "index.html";
        } else {
            pageName = pageName[0];
        }
        if (pageName=="admin.html") {

            $.getJSON(macroURL+"?prefix=getTitle&callback=?")
            .done(function(data) {
                window.title = data.title;
            })
            .fail(function(data) {
                $("#list").html("<p>Kunde inte ansluta till strecklistan, var vänlig <a href=\"admin.html\">försök igen</a>!</p>");
            });

            // Ändra länken på adminsidan
            $("#sheetLink").attr("href",sheetURL);
        } else { // if pageName == index.html
            // Ladda strecklistan om nuvarande sida är index.html (på en webbserver kanske inte index.html syns så därför används bara else)
            // getJSON skickar en JSONP request med vissa parameterar och kör sedan funktionen i .done() med 'data' som objekt
            $.getJSON(macroURL+"?prefix=getTable&callback=?")
            .done(function(data) {
                window.title = data.title;
                $('.list').html(createTable(data.groups, data.members, data.buttons));
            })
            .fail(function(data) {
                $("#list").html("<p>Kunde inte ansluta till strecklistan, var vänlig <a href=\"admin.html\">försök igen</a>!</p>");
            });
        }
    }
});

function adminLogin() {
    $("#loginErr").html("Loggar in..");
    $("#loginBtn").removeAttr("onclick");
    $("#loginBtn").prop('disabled', true);
    $.getJSON(macroURL+"?prefix=adminLogin&callback=?")
    .done(function(data) {
        if ($('#password').val()==data.password) {
            $('.list').html(createAdminPage(data.mail_pw));
        } else {
            $('#loginErr').html("Fel lösenord.")
            $("#loginBtn").attr("onclick","adminLogin()");
            $("#loginBtn").prop('disabled', false);
        }
    })
    .fail(function(data) {
        $("#list").html("<p>Kunde inte ansluta till strecklistan, var vänlig <a href=\"admin.html\">försök igen</a>!</p>");
    });
}



function createEmailFile() {
    $("#fileBtn").attr("value","Skapar fil...");
    $("#fileBtn").removeAttr("onclick");
    $("#fileBtn").prop('disabled', true);
    $.getJSON(macroURL+"?prefix=getEmails&callback=?")
    .done(function (data) {
        var str = JSON.stringify(data);
        var dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(str);
        var link = document.getElementById('fileLink').href = dataUri;
        $("#fileLink").html("emails.txt");
        $("#fileBtn").attr("onclick","createEmailFile()");
        $("#fileBtn").prop('disabled', false);
        $("#fileBtn").attr("value","Skapa streckmailsfil");
    })
    .fail(function (data) {
        $("#fileBtn").attr("onclick","createEmailFile()");
        $("#fileBtn").prop('disabled', false);
        $("#fileBtn").attr("value","Kunde inte skapa fil. Försök igen!");
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
        a.parent().attr('id', 'currentPlus');
        a.parent().css("display","none");
        a.parent().parent().parent().after(createPlussningsBox(name));
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
    $.getJSON(macroURL+"?"+"cid="+cid+"&change="+change+"&category="+category+"&comment="+comment+"&prefix=sendPayment&callback=?",
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
