// Test
// Sätt globala variabler (dessa hamnar under window)
var state = {},
    enterCode = "";
    tries = 0;
    dragging = false;
state.current = null;
state.processing = 0;

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
    $.getJSON(macroURL+"?prefix=getTable&pin="+enterCode+"&callback=?")
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
    $("section.activity ul").hide();
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
    //updateActivity();
    $("section.activity").delay(1200).fadeIn(500);
    enterCode = "";
    $("#numbers").removeClass("load");
    $("#fields .numberfield").removeClass("load");
    $("#status").removeClass("load");


    // Lägg till knappar i action-bar
    for (b in data.buttons) {
            $("div#action-bar-float ul").append('<li data-action="pay">' + data.buttons[b] + '</li>');
    }
    $("div#action-bar-float ul").append('<li data-action="input">#</li><li data-action="plus">+</li>');

    setTouchEvents();

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
                $("div#action-bar-float li").each(function(i,el){
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

    $("div#action-bar-float li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) {
            dragging = false;
            return;
        }
        if (!state.processing) {
            if ($(this).attr("data-action") == "pay") {
                pay($(this), parseInt($(this).text()));
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
                        $(this).html($(this).text());
                    }
                }
            }
        }
    });

    $("div#action-bar-float").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
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
        if (state.current == null) {
            actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
            actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0s ease-in-out, top 0s ease-in-out");
        } else if (state.current != null) {
            actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
            actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.1s ease-in-out, top 0.3s ease-in-out");
        }
        actionBarArrow.borderwidth = parseInt(actionBarArrow.css("border-width").substr(4,2));

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
    } else {
        actionBar.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.3s ease-in-out, top 0.3s ease-in-out");
        actionBarArrow.css("transition","opacity 0.2s ease-in-out, transform 0.2s ease-in-out, left 0.1s ease-in-out, top 0.3s ease-in-out");
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
   }, 10000);
}

function updateActivity() {
    $.getJSON(macroURL+"?prefix=getActivity&callback=?")
    .done(function(data) {
        if (data.list!="") {
            var html = '';
            for (li in data.list) {
                html += '<li><span class="time">'+data.list[li].time+'</span><span>'+data.list[li].name+'</span> '+data.list[li].type+' <span>'+data.list[li].amount+'</span> kr.</li>';
            }
            $("section.activity ul").html(html);
        }
    });
}

function pay(el,amount) {
    cid = el.parent().parent().attr("data-cid");
    if (!isNaN(amount)) {
        if (!state.processing) {
            el.addClass("loading-ring-button");
            el.html("<div></div>"+el.text());
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
        self.html(self.text());
        success = data.success;
        if (success) {
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
        self.html(self.text());
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
