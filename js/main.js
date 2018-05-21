var localdata = [];
var loading = false;
var start = true;
var alerted_storage = false;
var debugOn = false;

//Check to see if the browser supports localstorage
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

//Check to see if there are existing images
if (storageAvailable('localStorage')) {
    if (window.localStorage.moodboard) {
        loadBoard();
    }
}

function loadBoard() {
    loading = true;
    localdata = JSON.parse(window.localStorage.getItem('moodboard'));
    for (var i = 0; i < localdata.length; i++) {
        if (localdata[i].url == "hex") {
            addColor(localdata[i].color, localdata[i].x, localdata[i].y, i, localdata[i].style);
        } else {
            addImage(localdata[i].url, localdata[i].x, localdata[i].y, i, localdata[i].style, localdata[i].gray);
        }
    }
    loading = false;
}

function updateData() {
    try {
        window.localStorage.setItem('moodboard', JSON.stringify(localdata));
    } catch (e) {
        if (e.code == 22 || e.code == 1014) {
            if (!alerted_storage) {
                alert("The storage is full (max 5MB). Try using image urls instead of local files. You can still use the app, but your changes will no longer be saved :(");
                alerted_storage = true;
            }
        }
    }
}

function updateThis(el) {
    localdata[el.id].x = el.getAttribute('data-x');
    localdata[el.id].y = el.getAttribute('data-y');
    localdata[el.id].style = el.getAttribute('style');
    updateData();
}


//Checks to see if this is the first element to be added, and removes the start info
function checkStart() {
    if (start) {
        start = false;
        document.getElementById('start_info').classList.add('hidden');
    }
}

// target elements with the "draggable" class
interact('.draggable')
    .draggable({
        // enable inertial throwing
        inertia: true,
        // keep the element within the area of it's parent
        //        restrict: {
        //            restriction: "parent",
        //            endOnly: true,
        //            elementRect: {
        //                top: 0,
        //                left: 0,
        //                bottom: 1,
        //                right: 1
        //            }
        //        },
        // enable autoScroll
        autoScroll: false,

        // call this function on every dragmove event
        onmove: dragMoveListener,
        onend: function (event) {
            updateThis(event.target);
        }
    })
    .resizable({
        // resize from all edges and corners
        edges: {
            left: true,
            right: true,
            bottom: true,
            top: true
        },

        // keep the edges inside the parent
        restrictEdges: {
            outer: 'parent',
            endOnly: true,
        },

        // minimum size
        restrictSize: {
            min: {
                width: 100,
                height: 100
            },
        },

        inertia: true,
        preserveAspectRatio: true,
        onend: function (event) {
            updateThis(event.target);
        }
    })
    .on('resizemove', function (event) {
        var target = event.target,
            x = (parseFloat(target.getAttribute('data-x')) || 0),
            y = (parseFloat(target.getAttribute('data-y')) || 0);

        // update the element's style
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';
        target.style.maxWidth = null;

        // translate when resizing from top or left edges
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.webkitTransform = target.style.transform =
            'translate3d(' + x + 'px,' + y + 'px, 0)';

        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    });

function dragMoveListener(event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
        'translate3d(' + x + 'px, ' + y + 'px, 0)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

function addControls(div, bw) {
    var close = document.createElement('span');
    var up = document.createElement('span');
    var down = document.createElement('span');

    close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
    up.innerHTML = '<i class="fa fa-chevron-up" aria-hidden="true"></i>';
    down.innerHTML = '<i class="fa fa-chevron-down" aria-hidden="true"></i>';

    close.classList.add('close', 'controls');
    up.classList.add('up', 'controls');
    down.classList.add('down', 'controls');

    div.append(close);
    div.append(up);
    div.append(down);

    close.addEventListener('click', function () {

        //Animate the drop
        div.classList.add('drop');
        div.style.transform = 'translate3d(' + localdata[div.id].x + 'px,' + (parseInt(localdata[div.id].y) + window.innerHeight) + 'px, 0) rotate(20deg)';

        //wait 1s before doing the rest
        setTimeout(function () {
            //Offset the ids of the other elements
            for (var i = parseInt(div.id) + 1; i < localdata.length; i++) {
                var newid = localdata[i].id -= 1;
                document.getElementById(i).id = newid;
            }
            localdata.splice(div.id, 1);

            //remove the element
            document.body.removeChild(div);
            updateData();

            //add info text if no more images.
            if (localdata.length == 0) {
                start = true;
                document.getElementById('start_info').classList.remove('hidden');
            }
        }, 1000);
    });
    up.addEventListener('click', function () {
        div.style.zIndex++;
        updateThis(div);
    });
    down.addEventListener('click', function () {
        if (div.style.zIndex == 0) {
            var divs = document.getElementsByClassName('draggable');
            for (var i = 0; i < divs.length; i++) {
                divs[i].style.zIndex++;
                updateThis(divs[i]);
            }
        }
        div.style.zIndex--;
        updateThis(div);
    });

    if (bw) {
        var bw = document.createElement('span');
        bw.innerHTML = '<i class="fa fa-adjust" aria-hidden="true"></i>'
        bw.classList.add('bw', 'controls');
        div.append(bw);

        bw.addEventListener('click', function () {
            div.classList.toggle('grayscale');
            localdata[div.id].gray = !localdata[div.id].gray;
            updateData();
        });
    }
}

function addImage(src, x = 50, y = 100, id = localdata.length, style = false, gray = false) {
    var div = document.createElement('div');
    var img = document.createElement('img');

    img.src = src;
    img.setAttribute('alt', src);
    div.classList.add('draggable', 'just_added');
    div.id = id;
    if (style) {
        div.style = style;
    }
    if (gray) {
        div.classList.add('grayscale');
    }

    div.append(img);
    addControls(div, true);
    document.body.append(div);

    div.setAttribute("data-x", x);
    div.setAttribute("data-y", y);
    div.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
    div.style.zIndex = localdata.length;

    if (!loading) {
        div.style.maxWidth = '60%';

        localdata.push({
            url: src,
            x: x,
            y: y,
            zindex: localdata.length,
            id: id
        });
        updateData();
    }

    checkStart();
}

//Add color from hex code
function addColor(hex, x = 200, y = 100, id = localdata.length, style = false) {
    var div = document.createElement('div');
    var hexText = document.createElement('span');

    hexText.innerHTML = hex + '<div class="picker_container"><i class="fa fa-eyedropper" aria-hidden="true"></i><input class="color_picker" onchange="changeColor(this)" type="color" value="' + hex + '"></div>';

    div.classList.add('draggable', 'just_added', 'color');
    div.id = id;
    if (style) {
        div.style = style;
    }

    hexText.classList.add('hex');

    div.append(hexText);
    addControls(div, false);
    document.body.append(div);

    div.setAttribute("data-x", x);
    div.setAttribute("data-y", y);
    div.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
    div.style.backgroundColor = hex;
    div.style.zIndex = localdata.length;

    //Remove "preserve aspect ratio" when resizing colors.
    //removed for now, because of bug in firefox;
    //    div.addEventListener('mousedown', function () {
    //        interact('.draggable').resizable({
    //            preserveAspectRatio: false
    //        });
    //    });
    //    div.addEventListener('mouseup', function () {
    //        interact('.draggable').resizable({
    //            preserveAspectRatio: true
    //        });
    //    });

    if (!loading) {
        localdata.push({
            url: 'hex',
            x: x,
            y: y,
            zindex: localdata.length,
            id: id,
            color: hex
        });
        updateData();
    }

    checkStart();
}

function changeColor(el) {
    var color = el.value;
    var span = el.parentElement.parentElement;
    var div = span.parentElement;
    div.style.backgroundColor = color;
    span.childNodes[0].nodeValue = color;
    localdata[div.id].color = color;
    updateThis(div);
}


//Drop external images
function allowDrop(ev) {
    ev.preventDefault();
}

//Get file extension
function getExtension(fname) {
    return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
}

//Drop local images
function dropLocal(evt, x, y) {
    var files = evt.dataTransfer.files; // FileList object
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        if (getExtension(f.name) == 'mood') {
            if (start) {
                importBoard(f);
            } else if (confirm('Replace board? Your existing moodboard won\'t be saved.')) {
                clear(true);
                importBoard(f);
            } else {
                continue;
            }
        }
        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                //Add image at pointer location
                addImage(e.target.result, x, y);
                x += 20;
                y += 20;
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
}

function importBoard(file) {
    var reader = new FileReader();
    reader.onload = (function (theFile) {
        return function (e) {
            try {
                window.localStorage.setItem('moodboard', e.target.result);
                loadBoard();
            } catch (e) {
                alert('Failed to store');
                if (e.code == 22 || e.code == 1014) {
                    if (!alerted_storage) {
                        alert("The storage is full (max 5MB). Try using image urls instead of local files. You can still use the app, but your changes will no longer be saved :(");
                        alerted_storage = true;
                    }
                }
            }

        };
    })(file);
    reader.readAsText(file);
}

function drop(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    var x = ev.clientX - 50;
    var y = ev.clientY - 50;
    for (var i = 0; i < ev.dataTransfer.types.length; i++) {

        if (debugOn) {
            alert(ev.dataTransfer.types[i]);
        }
        
        if (ev.dataTransfer.types[i] == 'text/html') {
            var imageUrl = ev.dataTransfer.getData('text/html');

            //fix pinterest image size
            imageUrl = imageUrl.replace(/pinimg.com\/236x/, "pinimg.com/564x")

            var rex = / src="?([^"\s]+)"?\s*/;
            var url, res;
            url = rex.exec(imageUrl);
            addImage(url[1], x, y);
            return;
        } else if (ev.dataTransfer.types[i] == 'Files') {
            dropLocal(ev, x, y);
            return;
        }
    }
    alert('Sorry, unrecognized image type!');


}

//Add image button
function addButton(e) {
    e.preventDefault();
    var url = document.getElementById("img_url").value;
    document.getElementById("img_url").value = '';
    if (url != '' && url.length > 5) {
        if (url[0] == '#') {
            addColor(url);
        } else {
            addImage(url);
        }
    }
    toggleForm();
    document.getElementById("img_url").blur();
}

function toggleForm() {
    document.getElementById('form').classList.toggle('hidden');
    document.getElementById('img_url').focus();
}

//Extends and retracts the menu
function toggleMenu() {
    document.getElementById('menu').classList.toggle('extended');
    setTimeout(function () {
        document.getElementById('menu').classList.toggle('overflow');
    }, 500);
}

//Clear moodboard
function clear(internal = false) {
    if (internal || confirm("Clear moodboard?")) {

        for (var i = 0; i < localdata.length; i++) {
            document.body.removeChild(document.getElementById(localdata[i].id));
        }
        localdata = {};
        try {
            window.localStorage.removeItem('moodboard');
        } catch (e) {

        }
        start = true;
        document.getElementById('start_info').classList.remove('hidden');
    }

    document.getElementById('menu').classList.remove('extended', 'overflow');
}

//Creates a downloadable moodboard, and links it to the "export" anchor link
function exportBoard(link) {
    if (!localdata.length) {
        alert('Your moodboard is empty! Nothing to export.');
        return;
    }
    var name = prompt('Name your moodboard:');
    if (name) {
        link.download = name + '.mood';
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(localdata));
    }
}

window.dragMoveListener = dragMoveListener;

document.getElementById('add').addEventListener('click', toggleForm);
document.getElementById('menu_button').addEventListener('click', function () {
    toggleMenu();
});
document.getElementById('clear').addEventListener('click', function () {
    clear();
    toggleMenu();
});
document.getElementById('export').addEventListener('click', function () {
    exportBoard(this);
    toggleMenu();
});
document.getElementById('import').addEventListener('click', function () {
    alert('You can only import by dragging your .mood file in the window for now.\nSorry for the inconvenience!');
    toggleMenu();
});
document.getElementById('version').addEventListener('dblclick', function () {

    debugOn = !debugOn;

    alert('Debugging mode: ' + debugOn + '!\n(If this is a mistake, double-click the version number again to undo)');
});
