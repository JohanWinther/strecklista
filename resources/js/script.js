// Define default globals to be changed later
var enterCode = "0000"; // Default PIN code
var tries = 0; // PIN code tries
var dragging = false; // User is dragging on screen
var swish = "";
var state = {}; // State variable
state.current = null; // Active user element
state.processing = 0; // Processing a payment
state.menuIsOpen = 0;

// Run when website is ready to be manipulated
$(function() {

    window.actionBar = $("div#action-bar-float"); // Define action bar
    window.actionBarArrow = $("div.action-bar-arrow"); // Define action bar arrow
    actionBarArrow.borderwidth = parseInt(actionBarArrow.css("border-width").substr(4,2)); // Set width of arrow

    window.scrollTo(0, 0); // Scroll to top

    // scriptURL is read in config.php where it is fetched from the environment variables of the server
    if (scriptURL=="") $(".cell").html("Back-end är inte konfigurerad.<br>Konsultera installationsguiden.");

    // Read cookie and try saved PIN
    var pin = readCookie("PIN");
    if (pin != null){
        enterCode=pin;
    }
    sendPIN(0);
    tries--; // Reset tries

    // Disable plus menu
    $("#step2").css("opacity",0.5);
    $("#step3").css("opacity",0.5);
    $("#plusButtons").css("opacity",0.5);
    $("#plusSwish").css("opacity",0.5);

    // Click listener for PIN code buttons
    $("#numbers").on("click", "button", function() {
        var lengthOfCode = parseInt(enterCode.length);
        if (lengthOfCode < 4) {
            $("#message").removeClass("show");
            var clickedNumber = $(this).text().toString(); // Save number from element text
            enterCode = enterCode + clickedNumber;
            lengthOfCode = parseInt(enterCode.length) - 1;
            $("#fields .numberfield:eq(" + lengthOfCode + ")").addClass("active"); // Fill dots according to length
            if (lengthOfCode == 3) {
                $("#numbers").addClass("load");
                $("#fields .numberfield").removeClass("active");
                $("#fields .numberfield").addClass("load");
                tries++;
                if (tries<6) {
                    $("#status").addClass("load");
                    sendPIN(1); // Check the PIN
                } else {
                    $("#message").html("För många felaktiga försök!").addClass("show");
                }
            }
        }
    });
});

// Send PIN to server and retrieve data if right
function sendPIN(calledByUser) {
    // Send JSONP request
    $.getJSON(scriptURL+"?prefix=getData&pin="+enterCode+"&callback=?")
    .done(function(data) { // If response from server
        if (data==""){
            // Wrong PIN
            $("section#pinput").fadeIn(500);
            $("#numbers").removeClass("load");
            $("#fields .numberfield").removeClass("load");
            $("#status").removeClass("load");
            if (calledByUser) $("#message").html("Fel PIN-kod. "+(6-tries)+" försök kvar.").addClass("show");
            enterCode = "";
        } else {
            // Correct PIN
            $(".loading-ring-big div").css("animation","lds-dual-ring 0.8s ease-in-out infinite"); // Faster ring animation
            window.title = data.title; // Set global title from server
            document.title = window.title + " – Strecklista"; // Set tab/page title
            swish = data.swish;
            setData(data.table); // Setup table of users

            // Browser nagivation history
            window.onpopstate = function(event){
                changePage(event.state); // Change page if user goes back or forward
            };

            // If page was not refreshed, set list as default
            if (window.history.state != null) {
                changePage(window.history.state);
            } else {
                changePage("list");
                window.history.replaceState("list","","");
            }

            createCookie("PIN",enterCode,data.days_pin); // Set PIN as cookie
            $("#status").slideUp(500);

            // If users list is not empty, fill all user selections
            if (data.list!="") {
                var html = '<option value="">Välj..</option>';
                for (li in data.list) {
                    html += '<option value="'+data.list[li].cid+'">'+data.list[li].nick+'</option>';
                }
                $("section.settings select.users").html(html);
            }

            // Read cookie for favorite user and setup
            var favorite = readCookie("favorite");
            if (favorite != null) {
                $("#favoriteUser").val(favorite); // Dropdown selection list
                $("#plusUser").val(favorite); // Plus user list
                $("div#action-bar-top").attr("data-cid",favorite); // Top action bar user
                $("#action-bar-top > span").text("Strecka på "+$("#favoriteUser option:selected").text()); // Top action bar text
            }
            $("div.menu-button").fadeIn(500);
            $("section#pinput").hide(); // Hide PIN input = PINput

            // Set click listeners for all elements. This should probably be modularised into parts of the page rather than grouped by type, i.e. all data and listeners for e.g the menu should be handled in one function.
            setTouchEvents();
        }
    })
    .fail(function(data) { // If no response
        enterCode = "";
        $("#numbers").removeClass("load");
        $("#fields .numberfield").removeClass("load");
        $("#status").removeClass("load");
        $("#message").html("Kunde inte ansluta till servern.").addClass("show");
    });
}

// Setup list of users
function setData(data) {
    $('section#list').hide(); // List
    $('section#list').html(createTable(data.groups, data.members)); // Create table of users

    // Find pictures for every user
    $("div.profile").each(function(i,el) { // Do this for every user
        var imgUrl = 'https://s.gravatar.com/avatar/'+MD5($(el).attr("data-email"))+'?s=128&d=404'; // Set url to Gravatar of user

        // See if image exists
        $.ajax({
            url:imgUrl,
            type:"HEAD",
            crossDomain:true,
            success: function(){
                $(el).css("background-image", "url("+imgUrl+")"); // Set image if it exists
            },
            error:function(){
                imgUrl = 'https://s.gravatar.com/avatar/'+MD5($(el).attr("data-cid")+"@student.chalmers.se")+'?s=128&d=blank'; // Else use CID-email
                $(el).css("background-image", "url("+imgUrl+")");
            }
        });
    });

    // Get about data from JSON file
    $("section#about").load('/resources/data/about.html');

    runActivityFun(); // Start activity list updater
    $("section.activity").slideDown(1000);


    $("#numbers").removeClass("load");
    $("#fields .numberfield").removeClass("load");
    $("#status").removeClass("load");

    // Add buttons to action bars
    for (b in data.buttons) {
            $("div.action-bar ul").append('<li data-action="pay" data-amount="'+data.buttons[b]+'"><span>' + data.buttons[b] + '</span></li>');
    }
    // Add #-button to action bars
    $("div.action-bar ul").append('<li data-action="input"><span>#</span></li>');

    // Set windows resize callback and move action bar accordingly
    $(window).on('resize', function(e) {
            if (state.current != null) {
                ActionBar(1,{
                    left:state.current[0].offsetLeft,
                    top:state.current[0].offsetTop,
                    width:state.current[0].offsetWidth,
                    height:state.current[0].offsetHeight,
                    cid:state.current.attr("data-cid")
                });
            }
        });
}

// Click listener for all elements
function setTouchEvents() {

    // If user starts touch event, disable draggign (anticipate tap)
    $("body").on("touchstart", function(){
        dragging = false;
    });
    // If user starts moving, enable dragging
    $("body").on("touchmove", function(){
        dragging = true;
    });

    // Click listener for users
    $("section#list ul.cards li").on("click touchend", function(e) {
        // Stop extra click event when tapping
        e.stopPropagation();
        e.preventDefault();

        // Do nothing if user is dragging
        if (dragging) {
            dragging = false; // Reset
            return;
        }
        if (!state.processing) { // If no transaction is processing
            closeMenu();
            state.current = $(this); // Set active element to tapped user

            // If tapped user is not the currently active
            if (state.current.attr("data-cid")!=actionBar.attr("data-cid")) {
                scrollToCurrent();
                $("div.action-bar li").each(function(i,el){
                    resetColor($(el));
                });
                // Move action bar
                ActionBar(1,{
                    left:state.current[0].offsetLeft,
                    top:state.current[0].offsetTop,
                    width:state.current[0].offsetWidth,
                    height:state.current[0].offsetHeight,
                    cid:state.current.attr("data-cid")
                });
            } else {
                ActionBar(0); // Hide action bar
                state.current = null; // Remove active user
            }
        }
    });

    // Click listener for action bar buttons
    $("div.action-bar li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {

            // If user is active
            if ($(this).parent().parent().attr("data-cid")!="") {
                if ($(this).attr("data-action") == "pay") { // If normal button
                    pay($(this), parseInt($(this).attr("data-amount")));
                } else if ($(this).attr("data-action") == "input") { // If custom number input
                    var amount = prompt("Antal kronor:"); // Dialog box
                    // Check number is ok
                    if (amount != null) {
                        amount = parseInt(amount);
                        if (amount > 0) {
                            pay($(this), amount);
                        } else if (amount != null) {
                            flashColor($(this),"red");
                            $(this).removeClass("loading-ring-button");
                        }
                    }
                }
            }
        }
    });

    // Hijack touch event if action bar is tapped (no button). Else "body" will be regarded as tapped
    $("div.action-bar").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
    });

    // Click listener for menu button (top right)
    $("div.menu-button").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            ActionBar(0); // Hide action bar
            if (state.menuIsOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }
    });

    // Click listener for menu item
    $("nav ul.menu li").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }

        // Change page according to link
        var link = $(this).attr("data-link");
        changePage(link);
        if (window.history.state != link) {
            window.history.pushState(link, "", ""); // If not same page, add to page navigation history
        }
    });

    // Favorite user dropdown is changed
    $("#favoriteUser").on("change",function(e) {
        var cid = $(this).val();
        if (cid != "") {
            createCookie("favorite", cid);
            $("#plusUser").val(cid); // Change plus user default to favorite
            console.log(cid + " är satt som favorit.");
        } else {
            eraseCookie("favorite"); // Erase cookie if no favorite
        }
        $("#action-bar-top").attr("data-cid", cid);
        $("#action-bar-top > span").text("Strecka på "+$("#favoriteUser option:selected").text());
    });

    // Click listener for body, used for closing menus and such
    $(document).on("click touchend", function(e) {
        e.stopPropagation();
        //e.preventDefault(); // Don't enable this, no idea why
        closeMenu();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            if (state.current != null) {
                ActionBar(0);
                state.current = null;
            }
        }
    });

    // On change of plus input update Swish-link
    $("section#plus input#amount").on("input", function(e){
        var amount = parseInt(this.value);
        if (isNaN(amount)) {
            this.value = ""; // Empty if not a Number
        } else if (amount < 1) {
            this.value = 1; // Min
        } else if (amount > 5000) {
            this.value = 5000; // Max
        } else {
            this.value = parseInt(this.value);
        }
        updateSwishLink(this.value, $("section#plus select#plusUser").val());
    });

    // On change of user to plus on
    $("section#plus select#plusUser").on("change", function(e){
        updateSwishLink($("section#plus input#amount").val(),this.value);
    });

    // Confirm plus button
    $("span#confirmPlus").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }

        // If buttons are enabled
        if ($("#step3").css("opacity") == 1) {
            if (!state.processing) {
                $(this).css("color","hsl(0, 0%, 0%)");
                $(this).css("background-color","hsl(0, 0%, 100%)");
                state.processing = 1;
                var cid = $("section#plus select#plusUser").val();
                var change = parseInt($("section#plus input#amount").val());
                sendPayment(cid,change,'Plussning',$("a#swish-button").attr("data-ref"),$(this));
            }
        }
    });

    // Click listener for login button on admin page
    $("#loginBtn").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if ($("#loginBtn").attr("disabled") != "disabled") {
            adminLogin();
        }
    });
}

// Create html code for user list
function createTable(group,members) {
    var html = '';
    for (g in group) {
        html += '<h1>'+group[g]+'</h1>'; // Title for every group
        html += '<ul class="cards">'; // Start list
        // Loop through every person
        for (m in members[g]) {
            member = members[g][m].split(";"); // Split "cid;name;email" into array
            cid = member[0];
            name = member[1];
            email = member[2];

            if (email == "") {
                email = cid+"@student.chalmers.se";
            }
            // Create list items
            html += '<li data-cid=' + cid + '><div class="profile" data-cid="'+cid+'" data-email="'+email+'">';
            html += '<div>'+name.substr(0,1)+'</div>'; // Set profile pic as first letter (if no image)
            html += '</div>';
            html += '<div class="name">';
            html += name;
            html += '</div></li>';
        }
        html += '</ul>';
    }
    return html;
}

// Disable steps 2 and 3 in plus menu
function disableSteps() {
    $("#swish-button").removeAttr("href");
    $("#step2").css("opacity",0.5);
    $("#step3").css("opacity",0.5);
    $("#plusButtons").css("opacity",0.5);
    $("#plusSwish").css("opacity",0.5);
    $("#plusButtons span.button").removeAttr("style");
}

// Enable steps 2 and 3 in plus menu
function enableSteps() {
    $("#plusButtons").css("opacity",1);
    $("#plusSwish").css("opacity",1);
    $("#step2").css("opacity",1);
    $("#step3").css("opacity",1);
    $("#plusButtons span.button").css("cursor","pointer");
    $("swish-QR").removeAttr("src");
}

function openMenu() {
    $("div.bar1, div.bar2, div.bar3").addClass("close"); // Turn 3 blocks to cross
    $("nav").slideDown(200);
    state.menuIsOpen = 1;
}

function closeMenu() {
    $("div.bar1, div.bar2, div.bar3").removeClass("close"); // cross to 3 blocks again
    $("nav").slideUp(200);
    state.menuIsOpen = 0;
}

// Change current page
function changePage(link) {
    closeMenu();
    $("section.main").hide();
    $("section.activity").hide();
    $("#action-bar-top").hide();

    if (link == null || link == "list") {
        document.title = window.title + " – Strecklista";
        $("a#logo").text("Strecklista");
        $("section#list").show();
        $("section.activity").slideDown(500);
        // If favorite is chosen, show top action bar
        if ($("#action-bar-top").attr("data-cid") != "") $("#action-bar-top").fadeIn(500);
        updateActivity(); // Load activity list
    } else if (link == "stats") {
        document.title = window.title + " – Statistik";
        $("a#logo").text("Statistik");
        $("section#stats").show();
    } else if (link == "plus") {
        document.title = window.title + " – Plussa";
        $("a#logo").text("Plussa");
        $("section#plus").show();
    } else if (link == "settings") {
        document.title = window.title + " – Inställningar";
        $("a#logo").text("Inställningar");
        $("section#settings").show();
    } else if (link == "admin") {
        document.title = window.title + " – Admin";
        $("a#logo").text("Admin");
        $("section#admin").show();
    } else if (link == "about") {
        document.title = window.title + " – Om appen";
        $("a#logo").text("Om appen");
        $("section#about").show();
    }
}

// Update Swish-link and QR-code if amount and user is correct
function updateSwishLink(amount, cid) {
    if (amount == "" || cid == "") {
        disableSteps();
    } else {
        var ref = makeID(); // Create 5 character ID for reference
        var swishData = {
            "version": 1,
            "payee": {
                "value":swish
            },
            "message":{
                "value": "Plussa: "+ref
            },
            "amount": {
                "value": parseInt(amount)
            }
        }; // Swish data to put in link
        $("a#swish-button").attr("href","swish://payment?data="+encodeURIComponent(JSON.stringify(swishData))); // Swish-link
        $("a#swish-button").attr("data-ref",ref); // Save reference code for fetching when confirmation button is pressed

        /* Create QR-code for Swish.
         Format: C##########;#;message;#
         1st part is tel number
         2nd part is amount
         3rd part is message
         4th part is digit for editable fields:
         # = [tel, amount, message]
         0 = [0, 0, 0]
         1 = [1, 0, 0]
         2 = [0, 1, 0]
         3 = [0, 0, 1]
         4 = [1, 1, 0]
         5 = [1, 0, 1]
         6 = [0, 1, 1]
         7 = [1, 1, 1]
         */
        $("#swish-QR").attr("src",'https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=C'+swish+'%3B'+amount+'%3B'+"Plussa: "+ref+'%3B0&chld=H|1');
        enableSteps();
    }
}

// Scroll to selected user
function scrollToCurrent() {
    // Relative reference point for scrolling is top left of profile picture
    var offset = 0; // Offset height from reference point (down)
    var cardHeight = $("section#list ul.cards li")[0].offsetHeight;
    var abHeight = actionBar[0].offsetHeight; // Action bar height

    // If profile picture height + action bar height is larger than window
    if ((cardHeight + abHeight) >= $(window).height()) {
        offset = (cardHeight + abHeight) - $(window).height();
    } else {
        offset = -abHeight;
    }
    $('html, body').animate({
        scrollTop: state.current.offset().top + offset
    }, 600);
}

// Show/hide action bar and move it
function ActionBar(show, data) {
    if (show) {
        actionBar.attr("data-cid", data.cid);
        actionBar.css("top", data.top + actionBarArrow.borderwidth + data.height); // Set top position to top + arrow height
        var width = parseInt(actionBar.css('width'));
        // Set action bar aligned with middle of user
        var left = (data.left + data.width/2 - width/2);
        if (left <= 0.1*$(window).width()) { // If bar is too much to the left
            left = "10vw"; // Set to left limit
        } else if ((left + width) >= 0.9*$(window).width()) { // Too much right
            left = "calc(90vw - "+width+"px)"; // Set to right limit
        }

        actionBar.css("left", left);
        actionBar.css("transform", "scale(1)");
        actionBar.css("opacity", 1);

        actionBarArrow.css("top", data.top + data.height);
        actionBarArrow.css("left", data.left + data.width/2 - actionBarArrow.borderwidth);
        actionBarArrow.css("transform", "scale(1)");
        actionBarArrow.css("opacity", 1);

        // Set transitions AFTER (10 ms) previous calls else they will become instant
        setTimeout(function() {
            actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
            actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
        },10);
    } else { // If hide
        actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
        actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
        actionBarArrow.css("transform", "scale(0)");
        actionBar.css("transform", "scale(0)");
        actionBar.css("opacity", 0);
        actionBarArrow.css("opacity", 0);
        actionBar.attr("data-cid","");
    }
}

// Continuous updates of activity list
function runActivityFun() {
    setTimeout(function() {
        if (window.history.state == "list") updateActivity(); // Only update on list page
       runActivityFun(); // Call itself after 30 seconds
   }, 1000*30);
}

// Update activity list
function updateActivity() {
    $.getJSON(scriptURL+"?prefix=getActivity&pin="+enterCode+"&callback=?")
    .done(function(data) {
        $("section.activity > ul > li").unbind(); // Unbind all listeners on previous items to clear memory
        if (data != "") {
            if (data.list!="") {
                var html = '';
                // For every item up to 10 items
                for (var li = 0; li < data.list.length && li < 10; li++) {
                    var category ="";
                    if (data.list[li].category != "Minusning") {
                        // Set verb for category of transaction
                        switch (data.list[li].category) {
                            case "Streckning":
                            category = "streckade";
                            break;
                            case "Makulering":
                            category = "ångrade";
                            break;
                            case "Plussning":
                            category = "plussade";
                            break;
                            default:
                            category = "hackade in";
                        }
                        html += '<li data-category="'+ data.list[li].category +'" data-cid="'+ data.list[li].cid +'" data-time="'+ data.list[li].time +'" data-name="'+ data.list[li].name +'" data-amount="'+ Math.abs(data.list[li].amount) +'">'; // List item data
                        html += '<span class="time">'+ (data.list[li].time.substr(data.list[li].time.length - 8)).split(".").join(":") + '</span>'; // Time hh:mm:ss
                        html += '<span class="name">'+ data.list[li].name +'</span> ';
                        html += category;
                        html += ' <span class="amount">'+ Math.abs(data.list[li].amount) +'</span>';
                        html += ' kr.</li>';
                    }
                }
                $("section.activity ul").html(html);

                // Set new listeners
                $('section.activity > ul > li[data-category="Streckning"]').on("click touchend", function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (dragging) {
                        dragging = false;
                        return;
                    }
                    // Confirm dialog box
                    if (confirm('Vill du ångra streckningen på '+ $(this).attr("data-name") +' för '+ $(this).attr("data-amount") +' kr?')) {
                        var comment = prompt("Lämna en kort kommentar om vad som hände:");
                        if (comment != null) {
                            if (comment.length >= 5) {
                                sendPayment($(this).attr("data-cid"),parseInt($(this).attr("data-amount")),'Makulering',comment, $(this));
                            } else {
                                alert("Ångerbegäran avbröts på grund av för kort kommentar.");
                            }
                        } else {
                            alert("Du avbröt ångerbegäran.");
                        }
                    }
                });
            } else { // Activity list is empty
                html = '<li><span class="time">Inga senaste transaktioner.</span></li>';
                $("section.activity ul").html(html);
            }
        } else {
            alert("Fel PIN-kod!");
            location.reload(true); // Refresh page if PIN is wrong
        }
    });
}

// Add loaing ring to button and call sendPayment
function pay(el,amount) {
    cid = el.parent().parent().attr("data-cid");
    if (!isNaN(amount)) {
        if (!state.processing) {
            el.addClass("loading-ring-button");
            el.prepend("<div></div>"); // Div for loading ring
            el.find("span").first().text(amount); // Change text to amount (for custom input)
            state.processing = 1;
            change = -amount;
            sendPayment(cid,change,'Streckning','',el);
        }
    } else {
        alert("Knappen är inte ett tal!");
    }
}

// Send transaction to server
function sendPayment(cid,change,category,comment,self) {
    $.getJSON(scriptURL+"?"+"pin="+enterCode+"&cid="+cid+"&change="+change+"&category="+category+"&comment="+comment+"&prefix=sendPayment&callback=?")
    .done(function (data) {
        state.processing = 0;

        // Styles
        $("section#plus p#plusButtons .button").attr("style","");
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();

        // Reset #-button
        if (self.attr("data-action")=="input") self.find("span").first().text("#");
        if (data != "") {
            success = data.success;
            if (success) {
                updateActivity();
                flashColor(self,"green")
                console.log(cid+" har ändrats med "+change+" kr. Nu: "+data.current+" kr.");
                if (data.current <= 0) {
                    console.log(cid+" har "+(-data.current)+" kr i skuld!");
                } else if (data.current <=10) {
                    console.log(cid+" har endast "+(data.current)+" kr kvar att strecka på!");
                }

                // Add temporary entry in activity list
                if (change < 0) {
                    $("section.activity ul").prepend('<li><span class="time">Nyss&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="name">Du</span> streckade <span class="amount">'+Math.abs(change)+'</span> kr.</li>');
                } else {
                    $("section.activity ul").prepend('<li><span class="time">Nyss&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="name">Du</span> plussade <span class="amount">'+Math.abs(change)+'</span> kr.</li>')
                }
                // Set plus user dropdown to none just to show some confirmation
                $("section#plus select#plusUser").val("").change();

            } else { // If not succesful (but connected to server)
                flashColor(self,"red");
                if (change<0) {
                    alert("Kunde inte strecka "+(-change)+" kr på "+cid+": "+data.message);
                } else {
                    alert("Kunde inte lägga till "+change+" kr på "+cid+": "+data.message);
                }
            }
        } else {
            alert("Fel PIN-kod!");
            location.reload(true);
        }
    })
    .fail(function(data) {
        state.processing = 0;

        // Styles
        $("section#plus p#plusButtons .button").attr("style","");
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();

        // Reset #-button
        if (self.attr("data-action")=="input") self.find("span").first().text("#");
        flashColor(self,"red");
        if (change<0) {
            console.log("Kunde inte strecka "+(-change)+"kr på "+cid+": Ingen kontakt med servern. Försök igen!");
        } else {
            alert("Kunde inte lägga till "+change+"kr på "+cid+":  Ingen kontakt med servern. Bekräfta betalningen igen!");
        }
    });
}

// Flash jquery element with the selected color
function flashColor(el,color) {
    el.css("transition",""); // Remove transition to make change instant
    el.css("transition"); // Load transition to enable (else it will not work)
    el.css("background-color",color); // Change background color
    el.css("background-color"); // Load again
    el.css("transition","background 10s"); // Change transition
    el.css("transition"); // Load transition
    el.css("background",""); // Remove background and it will fade
}

// Remove all flashing instantly
function resetColor(el) {
    el.css("transition","");
    el.css("transition");
    el.css("background-color","");
    el.css("background-color");
}
