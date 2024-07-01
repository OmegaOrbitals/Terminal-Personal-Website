const inputElem = document.querySelector("#input");
const textElem = document.querySelector("#text");
const terminalElem = document.querySelector("#terminal");

let keys = {
  shift: false,
  ctrl: false
}

let commandHistory = [];
let commandHistoryIndex = -1;
let reading = false;
let readPromiseResolve;

function read() {
  return new Promise((resolve) => {
    reading = true;
    readPromiseResolve = resolve;
  })
}

function newInput(text) {
  if(readPromiseResolve) {
    readPromiseResolve(text);
  }
  reading = false;
}

function onTerminalResize() {
  terminalElem.scrollTop = terminalElem.scrollHeight;
}

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
    onTerminalResize();
  }
}

function changeInputSize() {
  inputElem.style.height = "5px";
  inputElem.style.height = (inputElem.scrollHeight) + "px";
  onTerminalResize();
}

function moveCaretToEnd(el) {
  if(typeof el.selectionStart == "number") {
    el.selectionStart = el.selectionEnd = el.value.length;
  } else if(typeof el.createTextRange != "undefined") {
    el.focus();
    var range = el.createTextRange();
    range.collapse(false);
    range.select();
  }
}

changeInputSize();

document.addEventListener("keydown", (ev) => {
  if(document.activeElement == document.body) inputElem.focus();
  if(ev.key == "Enter") {
    if(keys.shift == false) {
      ev.preventDefault();
      if(inputElem.value.trim() == "") {
        return output([
          {
            args: {
              "innerText": "$ "
            }
          }
        ])
      }
      output([
        {
          args: {
            "innerText": `$ ${inputElem.value}`
          }
        }
      ])
      if(reading == false) {
        inputElem.value.replace(";", "\n").split("\n").forEach((line) => {
          let isCommand = false;
          commands.forEach((command) => {
            command.aliases.forEach((alias) => {
              if(line.split(" ")[0] == alias) {
                command.run(line, command.aliases);
                isCommand = true;
              }
            })
          })
          if(!isCommand && line.trim() != "") {
            output([
              {
                args: {
                  innerText: `Command '${line.split(" ")[0]}' not found.`
                }
              }
            ])
          }
          if(commandHistory[commandHistory.length - 1] != line) {
            commandHistory.push(line);
            commandHistoryIndex = commandHistory.length;
          }
        })
      } else {
        newInput(inputElem.value);
      }
      inputElem.value = "";
    }
  }
  if(ev.key == "ArrowUp") {
    ev.preventDefault();
    if(commandHistoryIndex - 1 < 0) return;
    commandHistoryIndex -= 1;
    inputElem.value = commandHistory[commandHistoryIndex];
    moveCaretToEnd(input);
  }
  if(ev.key == "ArrowDown") {
    ev.preventDefault();
    if(commandHistoryIndex < commandHistory.length - 1) {
      commandHistoryIndex += 1;
      inputElem.value = commandHistory[commandHistoryIndex];
    } else {
      commandHistoryIndex = commandHistory.length;
      inputElem.value = "";
    }
    moveCaretToEnd(input);
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

inputElem.addEventListener("input", (ev) => {
  changeInputSize();
})

document.body.addEventListener("click", (ev) => {
  if(document.activeElement == document.body) inputElem.focus();
})

const commands = [
  {
    aliases: ["help", "ls"],
    description: "Lists available commands",
    run: () => {
      let res = "";
      for(let i = 0; i < commands.length; i++) {
        let command = commands[i];
        res += `${command.aliases} - ${command.description ? command.description : "No description"}\n`
      }
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
          type: "h2",
          args: {
            innerText: `About me`
          }
        },
        {
          args: {
            innerText: `I'm Omega. I do webdev, Node and Python. I enjoy programming, reading and gaming.`
          }
        }
      ])
    }
  },
  {
    aliases: ["history"],
    description: "Shows your command history",
    run: () => {
      let res = "";
      for(let i = 0; i < commandHistory.length; i++) {
        const command = commandHistory[i];
        res += `${i + 1}. ${command}\n`;
      }
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
    aliases: ["guessthenumber", "gtn"],
    description: "Play guess the number",
    run: async () => {
      let playing = true;
      while(playing) {
        let number = Math.floor(Math.random() * 10);
        let text = await read();
        output([
          {
            args: {
              innerText: `You ${number == text ? "win" : "lose"}, it was ${number}. Try again? `
            }
          }
        ])
        text = await read();
        if(!text.startsWith("y")) {
          playing = false;
        }
      }
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
