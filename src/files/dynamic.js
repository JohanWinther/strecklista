/* Skapa strecklistan som en HTML-table med:
    groups = lista med alla grupper
    members = lista med listor för alla medlemmar i respektive grupper
    buttons = lista med knappar
*/

function createTable(group,members,buttons) {
    // Skapa table
    var html = '';
    // Loopa igenom varje grupp
    for (g in group) {
        html += '<h1>'+group[g]+'</h1>';
        html += '<ul>';
        // Loopa igenom varje person
        for (m in members[g]) {
            html += '<li>';
            member = members[g][m].split(";");
            cid = member[0];
            name = member[1];
            html += name;
            /*html += '</td>';
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
            html += '</a></div></td>';*/
            html += '</li>';
        }
        html += '</ul>';
    }

    // Returnera tabell som html
    return html;
}
/*
function createTable(group,members,buttons) {
    // Skapa table
    var html = '';
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
}*/

function createPlussningsBox(name) {
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
return html;
}

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
    html += '<input type="submit" id="fileBtn" onclick="createEmailFile()" value="Skapa streckmailsfil" />';
    html += '<p><a href="#" id="fileLink" download="emails.txt" target="_blank" ="Högerklicka och Spara som..."></a></p>';
    html += '<input type="submit" id="sendBtn" onclick="sendEmails()" value="Skicka streckmail nu" /><span> (via ftek-streckning@outlook.com)</span>';
    html += '<p id="sendMessage"></p>';
    html += '<ol id="emailList"></ol>';
    html += '</div>';
    return html;
}
