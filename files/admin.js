// Sätt globala variabler (dessa hamnar under window)
var email_str = "";
var emailIdx = 0;

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
