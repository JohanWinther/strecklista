// Test
// Sätt globala variabler (dessa hamnar under window)
var state = {};
var enterCode = "";
var tries = 0;
state.action = "hide";

$(function() {
    // Detta körs när sidan är klar för att manipuleras

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
    $('section.list').html(createTable(data.groups, data.members, data.buttons)).fadeIn(1000);
    $("section.activity ul").hide();
    //updateActivity();
    $("section.activity").delay(1200).fadeIn(500);
    enterCode = "";
    $("#numbers").removeClass("load");
    $("#fields .numberfield").removeClass("load");
    $("#status").removeClass("load");

    $("section.list ul.cards li").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (state.action=="hide") {
            ActionBarClicked();
        }

    });

    $("document").on("click touchend", function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (state.action == "show") {
            ActionBarClicked();
        }
    });
}

function ActionBarClicked() {
    if (state.action=="hide") {
        state.action="show";
        ActionBar(1,{
            left:$(this)[0].offsetLeft,
            top:$(this)[0].offsetTop,
            width:$(this)[0].offsetWidth,
            height:$(this)[0].offsetHeight
        });
    } else {
        state.action="hide";
        ActionBar(0);
    }
}

function ActionBar(show, data) {
    if (show) {
        $("div.action-bar-arrow").css("top", data.top);
        $("div.action-bar-arrow").css("left", data.left);
        $("div.action-bar-arrow").css("transform", "scale(1)");

        $("div.action-bar").css("top", data.top);
        $("div.action-bar").css("left", data.left);
        $("div.action-bar").css("transform", "scale(1)");
    } else {
        $("div.action-bar-arrow").css("transform", "scale(0)");
        $("div.action-bar").css("transform", "scale(0)");
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
