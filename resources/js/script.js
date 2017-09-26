// Sätt globala variabler (dessa hamnar under window)
var state = {},
    enterCode = "0000";
    tries = 0;
    dragging = false;
    swish = "";
state.current = null;
state.processing = 0;
state.menuIsOpen = 0;

$(function() {
    // Detta körs när sidan är klar för att manipuleras

    window.scrollTo(0, 0);
    if (macroURL=="") $(".cell").html("Back-end är inte konfigurerad.<br>Konsultera installationsguiden.");

    // Try PIN in cookie
    var pin = readCookie("PIN");
    if (pin != null){
        enterCode=pin;
    }
    sendPIN(0);
    tries--;

    $("#step2").css("opacity",0.5);
    $("#step3").css("opacity",0.5);
    $("#plusButtons").css("opacity",0.5);
    $("#plusSwish").css("opacity",0.5);

    $("#numbers").on("click", "button", function() {
        var lengthCode = parseInt(enterCode.length);
        if (lengthCode < 4) {
            $("#message").removeClass("show");
            var clickedNumber = $(this).text().toString();
            enterCode = enterCode + clickedNumber;
            lengthCode = parseInt(enterCode.length);
            lengthCode--;
            $("#fields .numberfield:eq(" + lengthCode + ")").addClass("active");
            if (lengthCode == 3) {
                // Check the PIN
                $("#numbers").addClass("load");
                $("#fields .numberfield").removeClass("active");
                $("#fields .numberfield").addClass("load");
                tries++;
                if (tries<6) {
                    $("#status").addClass("load");
                    sendPIN(1);
                } else {
                    $("#message").html("För många felaktiga försök!").addClass("show");
                }
            }
        }
    });
});

function sendPIN(calledByUser) {
    $.getJSON(macroURL+"?prefix=getData&pin="+enterCode+"&callback=?")
    .done(function(data) {
        if (data==""){
            // Wrong PIN
            $("#numbers").removeClass("load");
            $("#fields .numberfield").removeClass("load");
            $("#status").removeClass("load");
            if (calledByUser)
            $("#message").html("Fel PIN-kod. "+(6-tries)+" försök kvar.").addClass("show");
            enterCode = "";
        } else {
            // Correct PIN
            window.title = data.title;
            document.title = window.title + " – Strecklista";
            if (window.history.state != null) {
                changePage(window.history.state);
            } else {
                window.history.replaceState("list","","");
            }
            window.onpopstate = function(event){
                changePage(event.state);
            };
            createCookie("PIN",enterCode,data.days_pin); // Set PIN as cookie
            $(".loading-ring-big div").css("animation","lds-dual-ring 0.8s ease-in-out infinite");
            swish = data.swish;
            setData(data.table);
            if (data.list!="") {
                var html = '<option value="">Välj..</option>';
                for (li in data.list) {
                    html += '<option value="'+data.list[li][0]+'">'+data.list[li][2]+'</option>';
                }
                $("section.settings select.users").html(html);
            }
            var favorite = readCookie("favorite");
            if (favorite != null) {
                $("#favoriteUser").val(favorite);
                $("#plusUser").val(favorite);
                $("div#action-bar-top").attr("data-cid",favorite);
                $("#action-bar-top > span").text("Strecka på "+$("#favoriteUser option:selected").text());
                $("div#action-bar-top").fadeIn(500);
            }
            $("div.menu-button").fadeIn(500);
            $("section#pinput").hide();
            setTouchEvents();
        }
    })
    .fail(function(data) {
        enterCode = "";
        $("#numbers").removeClass("load");
        $("#fields .numberfield").removeClass("load");
        $("#status").removeClass("load");
        $("#message").html("Kunde inte ansluta till servern.").addClass("show");
    });
}

function setData(data) {
    $('section#list').hide();
    $('section#list').html(createTable(data.groups, data.members)).fadeIn(500);
    $("div.profile").each(function(i,el) {
        var imgUrl = 'https://s.gravatar.com/avatar/'+MD5($(el).attr("data-email"))+'?s=128&d=404';
        // Image Does Not Exist
        $.ajax({
            url:imgUrl,
            type:"HEAD",
            crossDomain:true,
            success: function(){
                $(el).css("background-image", "url("+imgUrl+")");
            },
            error:function(){
                imgUrl = 'https://s.gravatar.com/avatar/'+MD5($(el).attr("data-cid")+"@student.chalmers.se")+'?s=128&d=blank';
                $(el).css("background-image", "url("+imgUrl+")");
            }
        });
    });
    runActivityFun();
    $("section.activity").slideDown(1000);
    $("#numbers").removeClass("load");
    $("#fields .numberfield").removeClass("load");
    $("#status").removeClass("load");

    // Lägg till knappar i action-bar
    for (b in data.buttons) {
            $("div.action-bar ul").append('<li data-action="pay" data-amount="'+data.buttons[b]+'"><span>' + data.buttons[b] + '</span></li>');
    }
    $("div.action-bar ul").append('<li data-action="input"><span>#</span></li>');

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

function setTouchEvents() {

    $("body").on("touchmove", function(){
        dragging = true;
    });

    $("body").on("touchstart", function(){
        dragging = false;
    });

    $("section#list ul.cards li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            closeMenu();
            state.current = $(this);
            if (state.current.attr("data-cid")!=actionBar.attr("data-cid")) {
                scrollToCurrent();
                $("div.action-bar li").each(function(i,el){
                    resetColor($(el));
                });
                ActionBar(1,{
                    left:state.current[0].offsetLeft,
                    top:state.current[0].offsetTop,
                    width:state.current[0].offsetWidth,
                    height:state.current[0].offsetHeight,
                    cid:state.current.attr("data-cid")
                });
            } else {
                ActionBar(0);
                state.current = null;
            }
        }
    });

    $("div.action-bar li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            if ($(this).parent().parent().attr("data-cid")!="") {
                if ($(this).attr("data-action") == "pay") {
                    pay($(this), parseInt($(this).attr("data-amount")));
                }
                if ($(this).attr("data-action") == "input") {
                    var amount = prompt("Antal kronor:");
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

    $("div.action-bar").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
    });

    $("div.menu-button").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            ActionBar(0);
            if (state.menuIsOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }
    });

    /*$("a#logo").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            closeMenu();
            $("section.main").hide();
            $("section#list").fadeIn(500);
            $("section.activity").slideDown(500);
        }
    });*/

    $("nav ul.menu li").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        var link = $(this).attr("data-link");
        changePage(link);
        if (window.history.state != link) {
            window.history.pushState(link, "", "");
        }
    });

    $("#favoriteUser").on("change",function(e) {
        var cid = $(this).val();
        if (cid != "") {
            createCookie("favorite", cid);
            $("#plusUser").val(cid);
            console.log(cid + " är satt som favorit.");
        } else {
            eraseCookie("favorite");
        }
        $("#action-bar-top").attr("data-cid", cid);
        $("#action-bar-top > span").text("Strecka på "+$("#favoriteUser option:selected").text());
    });

    $(document).on("click touchend", function(e) {
        e.stopPropagation();
        //e.preventDefault();
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

    $("section#plus input#amount").on("input", function(e){
        var amount = parseInt(this.value);
        if (isNaN(amount)) {
            this.value = "";
        } else if (amount < 1) {
            this.value = 1;
        } else if (amount > 5000) {
            this.value = 5000;
        } else {
            this.value = parseInt(this.value);
        }
        updateSwishLink(this.value, $("section#plus select#plusUser").val());
    });

    $("section#plus select#plusUser").on("change", function(e){
        updateSwishLink($("section#plus input#amount").val(),this.value);
    });

    $("span#confirmPlus").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if($("#step3").css("opacity") == 1) {
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

    $("span#adminBox").on("click touchend",function(e) {
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

function createTable(group,members) {
    // Skapa table
    var html = '';
    // Loopa igenom varje grupp
    for (g in group) {
        html += '<h1>'+group[g]+'</h1>';
        html += '<ul class="cards">';
        // Loopa igenom varje person
        for (m in members[g]) {
            member = members[g][m].split(";");
            cid = member[0];
            name = member[1];
            email = member[2];
            if (email == "") {
                email = cid+"@student.chalmers.se";
            }
            html += '<li data-cid=' + cid + '><div class="profile" data-cid="'+cid+'" data-email="'+email+'">';
            html += '<div>'+name.substr(0,1)+'</div>';
            html += '</div>';
            html += '<div class="name">';
            html += name;
            html += '</div></li>';
        }
        html += '</ul>';
    }

    // Returnera tabell som html
    return html;
}

function disableSteps() {
    $("#swish-button").removeAttr("href");
    $("#step2").css("opacity",0.5);
    $("#step3").css("opacity",0.5);
    $("#plusButtons").css("opacity",0.5);
    $("#plusSwish").css("opacity",0.5);
    $("#plusButtons span.button").removeAttr("style");
}

function enableSteps() {
    $("#plusButtons").css("opacity",1);
    $("#plusSwish").css("opacity",1);
    $("#step2").css("opacity",1);
    $("#step3").css("opacity",1);
    $("#plusButtons span.button").css("cursor","pointer");
    $("swish-QR").removeAttr("src");
}

function openMenu() {
    $("div.bar1, div.bar2, div.bar3").addClass("close");
    $("nav").slideDown(200);
    state.menuIsOpen = 1;
}

function closeMenu() {
    $("div.bar1, div.bar2, div.bar3").removeClass("close");
    $("nav").slideUp(200);
    state.menuIsOpen = 0;
}

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
        if ($("#action-bar-top").attr("data-cid") != "") $("#action-bar-top").fadeIn(500);
        updateActivity();
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

function updateSwishLink(amount, cid) {
    if (amount == "" || cid == "") {
        disableSteps();
    } else {
        var ref = makeID();
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
        };
        $("a#swish-button").attr("href","swish://payment?data="+encodeURIComponent(JSON.stringify(swishData)));
        $("a#swish-button").attr("data-ref",ref);
        $("#swish-QR").attr("src",'https://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=C'+swish+'%3B'+amount+'%3B'+"Plussa: "+ref+'%3B0&chld=H|1');
        enableSteps();
    }
}

function scrollToCurrent() {
    var offset = 0;
    var cardHeight = $("section#list ul.cards li")[0].offsetHeight;
    var abHeight = actionBar[0].offsetHeight;
    if ((cardHeight + abHeight) >= $(window).height()) {
        offset = (cardHeight + abHeight) - $(window).height();
    } else {
        offset = -abHeight;
    }
    $('html, body').animate({
        scrollTop: state.current.offset().top+offset
    }, 600);
}

function ActionBar(show, data) {
    if (show) {
        actionBar.attr("data-cid",data.cid);
        actionBar.css("top", data.top + actionBarArrow.borderwidth + data.height);
        var width = parseInt(actionBar.css('width'));
        var left = (data.left + data.width/2 - width/2);
        if (left <= 0.1*$(window).width() || (left + width) >= 0.9*$(window).width())
            left = "calc((100vw - "+width+"px)/2)";

        actionBar.css("left", left);
        actionBar.css("transform", "scale(1)");
        actionBar.css("opacity", 1);

        actionBarArrow.css("top", data.top + data.height);
        actionBarArrow.css("left", data.left + data.width/2 - actionBarArrow.borderwidth);
        actionBarArrow.css("transform", "scale(1)");
        actionBarArrow.css("opacity", 1);

        setTimeout(function() {
            actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
            actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
        },10);
    } else {
        actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
        actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
        actionBarArrow.css("transform", "scale(0)");
        actionBar.css("transform", "scale(0)");
        actionBar.css("opacity", 0);
        actionBarArrow.css("opacity", 0);
        actionBar.attr("data-cid","");
    }
}

function runActivityFun() {
    setTimeout(function() {
        if (window.history.state == "list") updateActivity();
       runActivityFun();
   }, 1000*30);
}

function updateActivity() {
    $.getJSON(macroURL+"?prefix=getActivity&pin="+enterCode+"&callback=?")
    .done(function(data) {
        $("section.activity > ul > li").unbind();
        if (data != "") {
            if (data.list!="") {
                var html = '';
                for (var li = 0; li<data.list.length && li < 10; li++) {
                    var category ="";
                    if (data.list[li].category != "Minusning") {
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
                        html += '<li data-category="'+ category +'" data-cid="'+ data.list[li].cid +'" data-time="'+ data.list[li].time +'" data-name="'+ data.list[li].name +'" data-amount="'+ Math.abs(data.list[li].amount) +'">';
                        html += '<span class="time">'+ data.list[li].time.substr(data.list[li].time.length - 8) + '</span>';
                        html += '<span class="name">'+ data.list[li].name +'</span> ';
                        html += category;
                        html += ' <span class="amount">'+ Math.abs(data.list[li].amount) +'</span>';
                        html += ' kr.</li>';
                    }
                }
                $("section.activity ul").html(html);
                $("section.activity > ul > li").on("click touchend", function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (dragging) {
                        dragging = false;
                        return;
                    }
                    if ($(this).attr("data-category") == "streckade") {
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
                    }
                });
            } else {
                html = '<li><span class="time">Inga senaste transaktioner.</span></li>';
                $("section.activity ul").html(html);
            }
        } else {
            alert("Fel PIN-kod!");
            location.reload(true);
        }
    });
}

function pay(el,amount) {
    cid = el.parent().parent().attr("data-cid");
    if (!isNaN(amount)) {
        if (!state.processing) {
            el.addClass("loading-ring-button");
            el.prepend("<div></div>");
            el.find("span").first().text(amount);
            state.processing = 1;
            change = -amount;
            sendPayment(cid,change,'Streckning','',el);
        }
    } else {
        alert("Knappen är inte ett tal!");
    }
}

function sendPayment(cid,change,category,comment,self) {
    $.getJSON(macroURL+"?"+"pin="+enterCode+"&cid="+cid+"&change="+change+"&category="+category+"&comment="+comment+"&prefix=sendPayment&callback=?")
    .done(function (data) {
        state.processing = 0;
        $("section#plus p#plusButtons .button").attr("style","");
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();
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
                $("section#plus select#plusUser").val("").change();
            } else {
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
        $("section#plus p#plusButtons .button").attr("style","");
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();
        if (self.attr("data-action")=="input") self.find("span").first().text("#");
        flashColor(self,"red");
        if (change<0) {
            console.log("Kunde inte strecka "+(-change)+"kr på "+cid+": Ingen kontakt med servern. Försök igen!");
        } else {
            alert("Kunde inte lägga till "+change+"kr på "+cid+":  Ingen kontakt med servern. Bekräfta betalningen igen!");
        }
    });
}

function flashColor(el,color) {
    el.css("transition","");
    el.css("transition");
    el.css("background-color",color);
    el.css("background-color");
    el.css("transition","background 10s");
    el.css("transition");
    el.css("background","");
}

function resetColor(el) {
    el.css("transition","");
    el.css("transition");
    el.css("background-color","");
    el.css("background-color");
}