const input = document.querySelector("#input");
const textElem = document.querySelector("#text");

let keys = {
  shift: false
}
let validElems = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "b"];

function output(text) {
  for(let line of text.split("\n")) {
    let elemName = line.split("/")[0];
    let lineElem = document.createElement((validElems.includes(elemName) ? elemName : "p"));
    line = line.replace(elemName + "/", "");
    lineElem.innerText = line;
    textElem.appendChild(lineElem);
  }
}

function changeInputSize() {
    input.style.height = "5px";
    input.style.height = (input.scrollHeight) + "px";
}

changeInputSize();

document.addEventListener("keydown", (ev) => {
  input.focus();
  if(ev.key == "Enter") {
    if(keys.shift == false) {
      ev.preventDefault();
      output(input.value);
      if(["help", "ls"].includes(input.value)) {
        output(`p/${input.value} - lists commands`);
      }
      input.value = "";
      changeInputSize();
    }
  }
  if(ev.key == "Shift") {
    keys.shift = true;
  }
})

document.addEventListener("keyup", (ev) => {
  if(ev.key == "Shift") {
    keys.shift = false;
  }
})

input.addEventListener("input", (ev) => {
  changeInputSize();
})

document.body.addEventListener("click", (ev) => {
  ev.preventDefault();
  input.focus();
})

document.body.addEventListener("touchend", (ev) => {
  ev.preventDefault();
  input.focus();
})