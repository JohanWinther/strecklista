function sendEmails() {

    $("#sendMessage").html("Skickar mail..");
    $("#emailList").html("");
    $("#sendBtn").removeAttr("onclick");
    $("#sendBtn").prop('disabled', true);
    $.getJSON(macroURL+"?prefix=getEmails&callback=?")
    .done(function (data) {
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
    })
    .fail(function (data) {

    });
    $(document).ajaxStop(function() {
        if (email_str!="") {
            $("#sendMessage").html("Skickade till följande:<br><a href=\"#\" id='hideLink' onclick='hideEmailList()' >Göm</a>");
        }
        $("#sendBtn").attr("onclick","sendEmails()");
        $("#sendBtn").prop('disabled', false);
    });
}

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
