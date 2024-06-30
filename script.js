const inputElem = document.querySelector("#input");
const textElem = document.querySelector("#text");

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
    lineElem.scrollIntoView();
  }
}

function changeInputSize() {
  inputElem.style.height = "5px";
  inputElem.style.height = (inputElem.scrollHeight) + "px";
}

changeInputSize();

document.addEventListener("keydown", (ev) => {
  if(inputElem != document.activeElement) return;
  if(ev.key == "Enter") {
    if(keys.shift == false) {
      ev.preventDefault();
      if(inputElem.value == "") return output();
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
          if(!isCommand) {
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
    if(commandHistoryIndex - 1 < 0) return;
    commandHistoryIndex -= 1;
    inputElem.value = commandHistory[commandHistoryIndex];
  }
  if(ev.key == "ArrowDown") {
    if(commandHistoryIndex + 2 > commandHistory.length) {
      commandHistoryIndex += 1;
      return inputElem.value = "";
    }
    commandHistoryIndex += 1;
    inputElem.value = commandHistory[commandHistoryIndex];
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
  if(document.activeElement != document.body) return;
  ev.preventDefault();
  inputElem.focus();
})

const commands = [
  {
    aliases: ["help"],
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
          args: {
            innerText: `WIP`
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
