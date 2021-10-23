"use strict";

var pnlLoading = document.getElementById("pnlLoading");
var pnlStart = document.getElementById("pnlStart");
var pnlFinish = document.getElementById("pnlFinish");
var pnlGame = document.getElementById("pnlGame");

const imgId = "imgPerson";
var imgPerson = document.getElementById("imgPerson");
var boxPerson = document.getElementById("boxPerson");
var boxes = document.querySelectorAll('.drop-box');
var score = document.getElementById("score");
var endScore = document.getElementById("endScore");
var totalPerson = document.getElementById("totalPerson");
var noPerson = document.getElementById("noPerson");
var isDragging;
var moveInterval;
var moveTime = 5000 / boxPerson.offsetHeight;

var conn = new signalR.HubConnectionBuilder()
    .withUrl("/game")
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

conn.start();

conn.on("Started", (data) => {
    console.log(data);
    score.innerText = data.score;
    totalPerson.innerText = data.total;
    noPerson.innerText = data.current;
    imgPerson.src = "/people/" + data.person.filename;
    imgPerson.setAttribute("data-id", data.person.id);
    imgPerson.style.top = "0px";

    pnlLoading.style.visibility = "hidden";
    pnlStart.style.visibility = "hidden";
    pnlFinish.style.visibility = "hidden";
    pnlGame.style.visibility = "visible";

    imgPerson.addEventListener('dragstart', handleDragStart);
    imgPerson.addEventListener('dragend', handleDragEnd);
    boxes.forEach(box => {
        box.addEventListener('dragover', handleDragOver);
        box.addEventListener('dragenter', handleDragEnter)
        box.addEventListener('dragleave', handleDragLeave);
        box.addEventListener('drop', handleDrop);
    });

    clearInterval(moveInterval);
    moveInterval = setInterval(handleMoveImage, moveTime);
    pnlLoading.style.visibility = "hidden";
});
conn.on("Checked", (data) => {
    score.innerText = data.score;
    next();
});
conn.on("Nexted", (data) => {
    console.log(data);
    imgPerson.style.top = "0px";
    imgPerson.src = "/people/" + data.person.filename;
    imgPerson.setAttribute("data-id", data.person.id);
    noPerson.innerText = data.current;
    pnlLoading.style.visibility = "hidden";
    clearInterval(moveInterval);
    moveInterval = setInterval(handleMoveImage, moveTime);
});
conn.on("Finished", (data) => {
    clearInterval(moveInterval);
    endScore.innerText = data;
    pnlFinish.style.visibility = "visible";
    pnlLoading.style.visibility = "hidden";
    pnlStart.style.visibility = "hidden";
    pnlGame.style.visibility = "hidden";
    boxes.forEach(box => {
        var item = box.getElementsByClassName("img-box")[0];
        if (item) {
            item.innerHTML = "";
        }
    });
});
conn.on("Error", () => {
    clearInterval(moveInterval);
    endScore.innerText = "Error!";
    pnlFinish.style.visibility = "visible";
    pnlLoading.style.visibility = "hidden";
    pnlStart.style.visibility = "hidden";
    pnlGame.style.visibility = "hidden";
});


function start() {
    pnlLoading.style.visibility = "visible";
    pnlStart.style.visibility = "hidden";
    conn.invoke("Start").catch((err) => {
        console.error(err);
    });
}
function check(id, nationality) {
    clearInterval(moveInterval);
    pnlLoading.style.visibility = "visible";
    conn.invoke("Check", id, nationality).catch((err) => {
        console.error(err);
    });
}
function next() {
    pnlLoading.style.visibility = "visible";
    conn.invoke("Next").catch((err) => {
        console.error(err);
    });
}


function handleMoveImage() {
    var top = parseInt(imgPerson.style.top);
    if (top < boxPerson.offsetHeight) {
        imgPerson.style.top = (top + 1) + "px";
    } else {
        check(imgPerson.getAttribute("data-id"), null);
    }
}

function handleDragStart(e) {
    if (e.target.id !== imgId) return;
    e.dataTransfer.setData("text", e.target.id);
    this.style.opacity = '0.4';
    clearInterval(moveInterval);

    boxes.forEach(function (box) {
        box.classList.add('start');
    });

    isDragging = true;
}

function handleDragEnd(e) {
    if (!isDragging) return;
    this.style.opacity = '1';

    clearInterval(moveInterval);
    moveInterval = setInterval(handleMoveImage, moveTime);

    boxes.forEach(function (box) {
        box.classList.remove('over');
        box.classList.remove('start');
    });

    isDragging = null;
}

function handleDragOver(e) {
    if (!isDragging) return;
    if (e.preventDefault) {
        e.preventDefault();
    }
}

function handleDragEnter(e) {
    if (!isDragging) return;
    this.classList.add('over');
}

function handleDragLeave(e) {
    if (!isDragging) return;
    this.classList.remove('over');
}

function handleDrop(e) {
    clearInterval(moveInterval);
    if (!isDragging) return;
    e.preventDefault();
    var box = e.target.getElementsByClassName("img-box")[0];
    if (box) {
        check(imgPerson.getAttribute("data-id"), e.target.id);
        var img = document.createElement("IMG");
        img.src = imgPerson.src;
        box.appendChild(img);
    }
}