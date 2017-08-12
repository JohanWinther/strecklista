var mouseDown = false;
var fingerDown = false;
$("html").on('mousedown', function() {
    mouseDown = true;
});
$("html").on('mouseup', function() {
    mouseDown = false;
});
$("html").on('click mousedown touchstart mousemove mouseup touchend touchmove', function(event) {
    console.log(event.type);

    /*if (event.type == "mouseup") documentClick = true;
    if (documentClick){
        console.log("clicked");
    }*/
 });

function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}
