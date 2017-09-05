// Test
// Sätt globala variabler (dessa hamnar under window)
var state = {},
    enterCode = "";
    tries = 0;
    dragging = false;
state.current = null;
state.processing = 0;
state.menu = [];
state.menu.item = "";
state.menu.level = "";

$(function() {
    // Detta körs när sidan är klar för att manipuleras

    window.scrollTo(0, 0);
    if (macroURL=="") $(".cell").html("Back-end är inte konfigurerad.<br>Konsultera installationsguiden.");
    var pin = readCookie("PIN");
    if(pin!=null){
        enterCode=pin;
        sendPIN();
    } else {
        $("#status").removeClass("load");
    }

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
                    sendPIN();
                } else {
                    $("#message").html("För många felaktiga försök!").addClass("show");
                }
            }
        }
    });
});

function sendPIN() {
    $.getJSON(macroURL+"?prefix=getData&pin="+enterCode+"&callback=?")
    .done(function(data) {
        if (data==""){
            // Wrong PIN
            enterCode = "";
            $("#numbers").removeClass("load");
            $("#fields .numberfield").removeClass("load");
            $("#status").removeClass("load");
            $("#message").html("Fel PIN-kod. "+(6-tries)+" försök kvar.").addClass("show");
        } else {
            createCookie("PIN",enterCode,10);
            $(".loading-ring-big div").css("animation","lds-dual-ring 0.8s ease-in-out infinite");
            setTable(data);
            if (data.list!="") {
                var html = '<ul class="menu" id="users">';
                for (li in data.list) {
                    html += '<li data-cid="'+data.list[li][0]+'" tabindex="'+li+'"><span>'+ data.list[li][2] +'</span></li>';
                }
                html += '</ul>'
                $("nav footer").before(html);
                $("nav ul#users > li").append('<li data-action="favorite"><span>Markera som favorit</span></li><li data-action="plus"><span>Plussa</span></li><li data-action="statistics"><span>Statistik</span></li>');
                $("nav ul#users").hide();
            }

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

function setTable(data) {
    window.title = data.title;
    $('section.list').hide();
    $('section.list').html(createTable(data.groups, data.members)).fadeIn(1000);
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
    updateActivity();
    enterCode = "";
    $("#numbers").removeClass("load");
    $("#fields .numberfield").removeClass("load");
    $("#status").removeClass("load");


    // Lägg till knappar i action-bar
    for (b in data.buttons) {
            $("div.action-bar ul").append('<li data-action="pay" data-amount="'+data.buttons[b]+'"><span>' + data.buttons[b] + '</span></li>');
    }
    $("div.action-bar ul").append('<li data-action="input"><span>#</span></li>');
    $("nav ul.menu#main").html('<li data-link="users" tabindex="0"><span>Användare</span></li><li data-link="settings" tabindex="1"><span>Inställningar</span></li><li data-link="admin" tabindex="2"><span>Admin</span></li>');
    state.menu.item = $("nav ul.menu#main");
    state.menu.level = 1;
    $("nav div.top-bar span#back").hide()
    $("nav div.top-bar span#title").css("margin-left","1em");
    $("nav div.menu-button").fadeIn(500);

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

    $("section.list ul.cards li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
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

    $("nav ul.menu li").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        var link = $(this).attr("data-link");
        if (link == "users") {
            MenuNavigateTo($("nav ul.menu#users"), $(this).text(), 1);
        } else if (link == "settings") {
            //
        } else if (link == "admin") {
            //
        }
    });

    $("nav div.top-bar span#back").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (state.menu.level == 2) {
            MenuNavigateTo($("nav ul.menu#main"), "Strecklista", -1);
        }
    });

    $("nav ul#users > li > li").on("click touchend",function(e) {
        e.stopPropagation();
        e.preventDefault();
        var action = $(this).attr("data-action");
        if (action == "favorite") {
            var cid = $(this).parent().attr("data-cid");
            createCookie("favorite", cid);
            console.log($(this).parent().attr("data-cid") + " är satt som favorit.");
            $("#action-bar-top").attr("data-cid", cid);
        }
    });

    $(document).on("click touchend", function(e) {
        e.stopPropagation();
        //e.preventDefault();
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
}

function MenuNavigateTo(to, title, add) {
    $("nav div.top-bar span#title").text(title);
    state.menu.item.hide();
    to.show();
    state.menu.item = to;
    state.menu.level += add;
    if (state.menu.level == 1) {
        $("nav div.top-bar span#back").css("opacity", 0);
        $("nav div.top-bar span#title").css("margin-left","1em");
    } else {
        $("nav div.top-bar span#back").removeAttr("style");
        $("nav div.top-bar span#title").removeAttr("style");
    }
}

function scrollToCurrent() {
    var offset = 0;
    var cardHeight = $("section.list ul.cards li")[0].offsetHeight;
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
       updateActivity();
       runActivityFun();
   }, 1000*30);
}

function updateActivity() {
    $.getJSON(macroURL+"?prefix=getActivity&callback=?")
    .done(function(data) {
        if (data.list!="") {
            var html = '';
            for (var li = 0; li<data.list.length || li < 10; li++) {
                var category;
                switch (data.list[li].category) {
                    case "SP":
                        category = "streckade";
                        break;
                    case "Makulering":
                        category = "ångrade";
                        break;
                    case "Plussning":
                        category = "plussade";
                        break;
                    default:
                        category = "streckade";
                }
                html += '<li><span class="time">'+data.list[li].time.substr(data.list[li].time.length - 8)+'</span><span>'+data.list[li].name+'</span> '+category+' <span>'+Math.abs(data.list[li].amount)+'</span> kr.</li>';
            }
            $("section.activity ul").html(html);
        } else {
            html = '<li><span class="time">Inga senaste transaktioner.</span></li>';
            $("section.activity ul").html(html);
        }
        $("section.activity").slideDown(1000);
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
            sendPayment(cid,change,'SP','',el);
        }
    } else {
        alert("Knappen är inte ett tal!");
    }
}
function payVal(cid,plus) {

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
                state.processing = 1;
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
    $.getJSON(macroURL+"?"+"cid="+cid+"&change="+change+"&category="+category+"&comment="+comment+"&prefix=sendPayment&callback=?")
    .done(function (data) {
        state.processing = 0;
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();
        if (self.attr("data-action")=="input") self.find("span").first().text("#");
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
        } else {
            flashColor(self,"red");
            if (change<0) {
                console.log("Kunde inte strecka "+(-change)+"kr på "+cid+": "+data.message);
            } else {
                alert("Kunde inte lägga till "+change+"kr på "+cid+": "+data.message);
            }
        }
    })
    .fail(function(data) {
        state.processing = 0;
        self.removeClass("loading-ring-button");
        self.find('div').first().remove();
        if (self.attr("data-action")=="input") self.find("span").first().text("#");
        flashColor(self,"red");
        if (change<0) {
            console.log("Kunde inte strecka "+(-change)+"kr på "+cid+": Ingen kontakt med servern.");
        } else {
            alert("Kunde inte lägga till "+change+"kr på "+cid+":  Ingen kontakt med servern.");
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


function closeCommentBox() {
    $('#currentPlus').removeAttr('style');
    $('#currentPlus').removeAttr('id');
    $('#plus-box').remove();
}

function round(number, decimals) { return +(Math.round(number + "e+" + decimals) + "e-" + decimals); }
