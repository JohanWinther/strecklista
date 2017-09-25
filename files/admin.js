// Sätt globala variabler (dessa hamnar under window)
var email_str = "";
var emailIdx = 0;

function adminLogin() {
    /*
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
    });*/
    var host = "smtp-mail.outlook.com",
        port = "587",
        secure = "tls",
        user = "ftek-streckning@outlook.com",
        password = ".mRM~!m,",
        to = "welocy95@gmail.com",
        email = "ftek-streckning@outlook.com",
        from = "Ebba Ekblom",
        subject = "Hej där!",
        body = 'Testmeddelande med <a href="https://ftek.se">testlänk</a>.';
    dataString = "host="+encodeURIComponent(host);
    dataString += "&port="+encodeURIComponent(port);
    dataString += "&secure="+encodeURIComponent(secure);
    dataString += "&user="+encodeURIComponent(user);
    dataString += "&password="+encodeURIComponent(password);
    dataString += "&email="+encodeURIComponent(email);
    dataString += "&to="+encodeURIComponent(to);
    dataString += "&from="+encodeURIComponent(from);
    dataString += "&subject="+encodeURIComponent(subject);
    dataString += "&body="+encodeURIComponent(body);
    $.post("/files/email.php", dataString, function(data, textStatus) {
        console.log(data);
        console.log(textStatus);
        //data contains the JSON object
        //textStatus contains the status: success, error, etc
    }, "json");
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
