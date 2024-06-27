const input = document.querySelector("#input");
const textElem = document.querySelector("#text")

function output(text) {
  for(let line of text.split("\n")) {
    let p = document.createElement("p");
    p.innerText = line;
    textElem.appendChild(p);
  }
}

function changeInputSize() {
    input.style.height = "5px";
    input.style.height = (input.scrollHeight) + "px";
}

changeInputSize();

document.addEventListener("keydown", (ev) => {
  console.log(ev)
  if(ev.key == "Enter") {
    if(["help", "ls"].includes(input.value)) {
      output(`help - lists commands`);
      input.value = "";
    }
  }
})

input.addEventListener("input", (ev) => {
  changeInputSize();
})

document.body.addEventListener("touchend", (ev) => {
  ev.preventDefault();
  input.focus();
})