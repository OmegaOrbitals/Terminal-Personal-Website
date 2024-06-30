const input = document.querySelector("#input");
const textElem = document.querySelector("#text");

let keys = {
  shift: false,
  ctrl: false
}
let commandHistory = [];
let commandHistoryIndex = -1;

const commands = [
  {
    aliases: ["help"],
    description: "Lists available commands",
    run: () => {
      let res = "";
      commands.forEach((command) => {
        res += `${command.aliases} - ${command.description ? command.description : "No description"}\n`
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
  },
  {
    aliases: ["history"],
    run: () => {
      let res = "";
      commandHistory.forEach((command, index) => {
        res += `${index + 1}. ${command}\n`;
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
    aliases: ["linktest"],
    run: () => {
      output([
        {
          type: "a",
          args: {
            href: "https://example.com",
            innerText: "Link"
          }
        }
      ])
    }
  }
]

function output(elements) {
  if(!elements) {
    let lineElem = document.createElement("br");
    return textElem.appendChild(lineElem);
  }
  for(let element of elements) {
    let lineElem = document.createElement(element.type ? element.type : "p");
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
      if(input.value == "") return output();
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
      if(commandHistory[commandHistory.length - 1] != input.value) {
        commandHistory.push(input.value);
        commandHistoryIndex = commandHistory.length;
      }
      input.value = "";
      changeInputSize();
    }
  }
  if(ev.key == "ArrowUp") {
    if(commandHistoryIndex - 1 < 0) return;
    commandHistoryIndex -= 1;
    input.value = commandHistory[commandHistoryIndex];
  }
  if(ev.key == "ArrowDown") {
    if(commandHistoryIndex + 2 > commandHistory.length) {
      commandHistoryIndex += 1;
      return input.value = "";
    }
    commandHistoryIndex += 1;
    input.value = commandHistory[commandHistoryIndex];
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
  if(document.activeElement != document.body) return;
  ev.preventDefault();
  input.focus();
})
