const input = document.querySelector("#input");
const textElem = document.querySelector("#text");

let keys = {
  shift: false,
  ctrl: false
}

const commands = [
  {
    aliases: ["help"],
    description: "Lists available commands",
    run: () => {
      let res = "";
      commands.forEach((command) => {
        res += `${command.aliases} - ${command.description}\n`
      })
      output([
        {
          args: {
            innerText: res
          }
        }
      ])
    }
  },
  {
    aliases: ["about", "aboutme"],
    description: "About me",
    run: () => {
      output([
        {
          args: {
            innerText: `WIP`
          }
        }
      ])
    }
  }
]

function output(elements) {
  for(let element of elements) {
    let lineElem = document.createElement(element.type && element.type ? element.type : "p");
    if(element.href) {
      lineElem.addEventListener("click", (ev) => {
        ev.preventDefault();
        if(keys.ctrl == true) {
          window.open(element.href);
        }
      })
    }
    for(let key of Object.keys(element.args)) {
      lineElem[key] = element.args[key];
    }
    textElem.appendChild(lineElem);
  }
}

function changeInputSize() {
  input.style.height = "5px";
  input.style.height = (input.scrollHeight) + "px";
}

changeInputSize();

document.addEventListener("keydown", (ev) => {
  if(input != document.activeElement) return;
  if(ev.key == "Enter") {
    if(keys.shift == false) {
      ev.preventDefault();
      output([
        {
          args: {
            "innerText": input.value
          }
        }
      ])
      commands.forEach((command) => {
        command.aliases.forEach((alias) => {
          if(input.value.split(" ")[0] == alias) {
            command.run(input.value, command.aliases);
          }
        })
      })
      input.value = "";
      changeInputSize();
    }
  }
  if(ev.key == "Shift") {
    keys.shift = true;
  }
  if(ev.key == "Control") {
    keys.ctrl = true;
  }
})

document.addEventListener("keyup", (ev) => {
    if(ev.key == "Shift") {
      keys.shift = false;
    }
    if(ev.key == "Control") {
      keys.ctrl = false;
    }
})

input.addEventListener("input", (ev) => {
  changeInputSize();
})

document.body.addEventListener("click", (ev) => {
  ev.preventDefault();
  input.focus();
})
