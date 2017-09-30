// Globals
var email_str = ""; // html of email address list
var emailIdx = 0; // Index of email in list
var emailState = []; // Boolean with send status of each email
var preview = false; // Emails are preview or not
var mail_user = "";
var mail_pw = "";
var password = "";

// User taps login button
function adminLogin() {
    $("#loginMessage").text("Loggar in..");
    $("#loginBtn").attr('disabled', true);
    password = $("input#password").val();

    // Send request for admin data
    $.getJSON(scriptURL+"?prefix=adminLogin&pin="+enterCode+"&password="+encodeURIComponent(password)+"&callback=?")
    .done(function(data) {
        if (data != "") {
            mail_user = data.mail_user;
            mail_pw = data.mail_pw;
            mail_name = data.mail_name;
            $("#loginBox").hide();
            $("#adminBox").fadeIn(500); // Show admin page content

            // Click listener for test email button
            $("#sendTestEmail").on("click touchend",function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (dragging) {
                    dragging = false;
                    return;
                }

                // Only if button is not disabled
                if ($(this).attr("disabled") != "disabled") {
                    var to = $("#adminBox input#email").val(); // Set email adress
                    if (to != "") {
                        $("#emailList").slideUp(500); // Hide email list
                        $("#emailList").html("");
                        sendEmail(
                            mail_user,
                            mail_pw,
                            mail_name,
                            to,
                            "Testutskick från "+location.href,
                            "Hej!<br><br>Detta meddelande är ett <b>testutskick</b>.<br><br>Med vänlig hälsning<br><a href='"+location.href+"' target='_blank'>"+location.href+"</a>",
                            "0",0);
                        $("#adminBox input#email").val("");
                    } else {
                        $("#adminBox input#email").focus();
                    }
                }
            });

            // Click listener for preview emails button
            $("#previewEmails").on("click touchend",function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (dragging) {
                    dragging = false;
                    return;
                }
                if ($(this).attr("disabled") != "disabled") {
                    preview = true;
                    sendEmails();
                }
            });

            // Click listener for send emails button
            $("#sendEmails").on("click touchend",function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (dragging) {
                    dragging = false;
                    return;
                }
                if ($(this).attr("disabled") != "disabled") {
                    preview = false;
                    sendEmails();
                }
            });

            // When server requests have stopped
            $(document).ajaxStop(function() {
                if (email_str!="") { // If emails were just loaded
                    if (preview) {
                        $("#emailStatus").text("Sändningsadress "+mail_user+" ("+mail_name+")");
                        email_str = ""; // If another request is made, don't run this again

                        $("#sendTestEmail").attr('disabled', false);
                        $("#sendEmails").attr('disabled', false);
                        $("#previewEmails").attr('disabled', false);
                        $('html, body').animate({
                            scrollTop: $("#sendEmails").offset().top // Scroll to emails
                        }, 500);
                    } else { // Send emails
                        // If all emails are sent
                        if (emailState.every(function(el){return el==1})) {
                            $("#emailStatus").text("Klar!");
                            email_str = "";
                            emailState = [];
                            $("#sendTestEmail").attr('disabled', false);
                            $("#sendEmails").attr('disabled', false);
                            $("#previewEmails").attr('disabled', false);
                        } else {
                            $("#emailStatus").text("Skickar mail (stäng inte sidan!)..");
                        }
                    }
                }
            });

        } else {
            $('#loginMessage').text("Fel lösenord.")
            $("#loginBtn").attr('disabled', false);
        }
    })
    .fail(function(data) {
        $("#loginMessage").text("Kunde inte ansluta till servern!");
        $("#loginBtn").attr('disabled', false);
    });
}

// Send emails according to email object from server
function sendEmails() {
    $("#emailStatus").text("Laddar listan av mail..");
    $("#sendTestEmail").attr('disabled', true);
    $("#previewEmails").attr('disabled', true);
    $("#sendEmails").attr('disabled', true);

    $.getJSON(scriptURL+"?prefix=getEmails&pin="+enterCode+"&password="+password+"&preview="+preview+"&callback=?")
    .done(function (data) {
        $("#emailList").html("");
        $("#emailList").slideUp(500);
        email_str = "";
        emailIdx = 0;
        if (!preview) {
            // Create array filled with zeroes of length same as number of emails
            emailState = Array.apply(null, Array(data.emails.length)).map(Number.prototype.valueOf,0);
        }

        // Build html list for all email items
        for (e in data.emails) {
            if (data.emails[e].email != "") {
                emailID = "email"+emailIdx; // Set element id to email#
                email_str += '<li id="'+emailID+'">';
                email_str += '<span class="to"><a href="mailto:'+data.emails[e].email+'" target="_blank">'+data.emails[e].email+'</a> ('+data.emails[e].nick+')</span><span class="status"></span>';
                if (preview) { // Also show subect and message if previewing
                    email_str += '<br>';
                    email_str += '<span class="subject">' + data.emails[e].subject + '</span>';
                    email_str += '<br>';
                    email_str += '<span class="body">' + data.emails[e].body + '</span>';
                }
                email_str += '</li>';
                if (!preview) { // If sending
                    // create a closure to preserve the value of "e" (which would else get changed on next loop)
                    (function(e,emailIdx){
                        window.setTimeout(function(){
                            sendEmail(mail_user, mail_pw, mail_name, data.emails[e].email, data.emails[e].subject, data.emails[e].body, emailIdx, 0);
                        }, e * 2000); // Send email every 2 seconds
                    }(e,emailIdx));
                }
                emailIdx++;
            }
        }
        if (email_str=="") {
            $("#emailStatus").text("Inga mail.");
        } else {
            $("#emailList").html(email_str);
            $("#emailList").fadeIn(500);
            if (!preview) {
                $("#emailStatus").text("Skickar mail (stäng inte sidan)..");
            }
            $('html, body').animate({
                scrollTop: $("#sendEmails").offset().top
            }, 500);
        }
    })
    .fail(function (data) {
        $("#emailStatus").text("Kunde inte ansluta till servern!");
        $("#sendTestEmail").attr('disabled', false);
        $("#previewEmails").attr('disabled', false);
        $("#sendEmails").attr('disabled', false);
    });
}

// Send email through request to email.php
function sendEmail(mail_user, mail_pw, mail_name, to, subject, body, emailIdx, numberOfTries) {
    if (numberOfTries <= 10) {
        if (numberOfTries == 0) { // First time trying to send
            $("#emailList > li#email"+emailIdx).find("span.status").text(" - Skickar..");
        } else { // Second time or more trying to send
            $("li#email"+emailIdx).find("span.status").text(" - Försök nr "+(numberOfTries+1)+"..");
        }

        // SMTP settings for Outlook
        var host = "smtp-mail.outlook.com";
        var port = "587";
        var secure = "tls";
        var url = location.href; // Application url from where the smtp call was made (good to set to not be flagged as spam)

        // Add all variables to data string (to be send to php file)
        dataString = "host="+encodeURIComponent(host);
        dataString += "&port="+encodeURIComponent(port);
        dataString += "&secure="+encodeURIComponent(secure);
        dataString += "&user="+encodeURIComponent(mail_user);
        dataString += "&password="+encodeURIComponent(mail_pw);
        dataString += "&email="+encodeURIComponent(mail_user);
        dataString += "&to="+encodeURIComponent(to);
        dataString += "&from="+encodeURIComponent(mail_name);
        dataString += "&subject="+encodeURIComponent(subject);
        dataString += "&body="+encodeURIComponent(body);

        // Send POST request to server
        $.ajax({
            url: "/resources/php/email.php",
            method: "POST",
            data: dataString,
            timeout: 10000,
            dataType: "json"
        }).done(function(data) {
            if (data) { // If successful
                $("li#email"+emailIdx).find("span.status").text(" - Klar!");
                emailState[emailIdx] = 1;
            } else if (data.statusText == undefined) { // If not successful, try again
                sendEmail(mail_user, mail_pw, mail_name, to, subject, body, emailIdx, numberOfTries+1);
            } else { // If statusText is not undefined the email was probably sent, even if it was a "timeout". It's weird but that's how it is.
                $("li#"+emailIdx).find("span.status").text(" - Klar!");
                emailState[emailIdx] = 1;
            }
        }).fail(function(data) {
            sendEmail(mail_user, mail_pw, mail_name, to, subject, body, emailIdx, numberOfTries+1);
        });
    } else {
        $("li#email"+emailIdx).find("span.status").text(" - Kunde inte skicka!");
    }
}
