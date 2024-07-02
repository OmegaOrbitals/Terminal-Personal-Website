const inputElem = document.querySelector("#input");
const textElem = document.querySelector("#text");
const terminalElem = document.querySelector("#terminal");
const promptElem = document.querySelector("#prompt");

let keys = {
  shift: false,
  ctrl: false
}

let commandHistory = [];
let commandHistoryIndex = -1;
let reading = false;
let readPromiseResolve;
let isInShell = true;

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
  window.scrollTo({
      top: document.body.scrollHeight
  })
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

function autoscroll(el) {
  if(typeof el.selectionStart == "number") {
    el.selectionStart = el.selectionEnd = el.value.length;
  } else if(typeof el.createTextRange != "undefined") {
    el.focus();
    var range = el.createTextRange();
    range.collapse(false);
    range.select();
  }
}

document.addEventListener("keydown", async (ev) => {
  if(document.activeElement == document.body && !window.getSelection().toString()) inputElem.focus();
  if(ev.key == "Enter") {
    if(keys.shift) return;
    ev.preventDefault();
    output([
      {
        args: {
          "innerHTML": `${(reading == false) ? "<span style='color: lightgreen'>$ </span>" : ""}${inputElem.value}`
        }
      }
    ])
    let inputValue = inputElem.value;
    inputElem.value = "";
    changeInputSize();
    if(reading == false) {
      const lines = inputValue.replace(";", "\n").split("\n").map(line => line.trim());
      isInShell = false;
      promptElem.style.display = "none";
      const linePromises = lines.map(async (line) => {
        let isCommand = false;
        for(let command of commands) {
          for(let alias of command.aliases) {
            if(line.split(" ")[0] == alias) {
              await command.run(line, command.aliases);
              isCommand = true;
            }
          }
        }
        if(!isCommand && line != "") {
          output([
            {
              args: {
                innerText: `Command '${line.split(" ")[0]}' not found.`
              }
            }
          ])
        }
        if(commandHistory[commandHistory.length - 1] != line && !inputValue.startsWith(" ")) {
          commandHistory.push(line);
          commandHistoryIndex = commandHistory.length;
        }
      })
      await Promise.all(linePromises);
      isInShell = true;
      promptElem.style.display = "block";
    } else {
      newInput(inputValue);
    }
  }
  if(ev.key == "ArrowUp") {
    ev.preventDefault();
    if(commandHistoryIndex - 1 < 0) return;
    commandHistoryIndex -= 1;
    inputElem.value = commandHistory[commandHistoryIndex];
    changeInputSize();
    autoscroll(inputElem);
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
    changeInputSize();
    autoscroll(inputElem);
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

document.addEventListener("click", (ev) => {
  if(document.activeElement == document.body && !window.getSelection().toString()) inputElem.focus();
})

document.addEventListener("touchend", (ev) => {
  if(document.activeElement == document.body) inputElem.focus();
})

changeInputSize();
output([
  {
    args: {
      innerText: "Welcome to my personal website!\nType 'help' for a list of commands."
    }
  }
])

const commands = [
  {
    aliases: ["help", "ls"],
    description: "Lists available commands",
    run: () => {
      let res = "";
      for(let i = 0; i < commands.length; i++) {
        let command = commands[i];
        res += `${command.aliases} - ${command.description ? command.description : "No description"}. Category: ${command.category ? command.category : "General"}\n`
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
    aliases: ["history"],
    description: "Shows your command history",
    run: async () => {
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
    aliases: ["linktest"],
    run: async () => {
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
  },
  {
    aliases: ["about", "aboutme"],
    description: "About me",
    category: "Personal",
    run: async () => {
      output([
        {
          args: {
            innerText: `I'm Omega. I do webdev, Node and Python. I enjoy programming, reading and gaming.\nThis website was made for Hack Club's arcade. This was just meant to be a quick terminal-themed personal website, but I had so much fun making it, so I made a whole command system (aka tortured myself with async/await & Promises). This has command history, blocking input reading, and more. I'm also planning on adding a lot more commands and maybe a command builder.`
          }
        }
      ])
    }
  },
  {
    aliases: ["projects"],
    description: "My projects",
    category: "Personal",
    run: async () => {
      output([
        {
          args: {
            innerText: `I don't have that many completed projects, but here are some of them.`
          }
        },
        {
          type: "a",
          args: {
            innerHTML: `<br>Terminal Personal Website - my personal website. It's not just themed like a terminal, it IS a terminal!<br><br>`,
            href: `https://github.com/OmegaOrbitals/Terminal-Personal-Website`,
            target: "_blank"
          }
        },
        {
          type: "a",
          args: {
            innerHTML: `Tackpad - this lets you control a cursor using a touchscreen device. Like a trackpad! Extremely buggy.<br><br>`,
            href: `https://github.com/OmegaOrbitals/tackpad`,
            target: "_blank"
          }
        },
        {
          type: "a",
          args: {
            innerHTML: `Illuminate - a website I made for the Illuminate hackathon. I didn't win (I think I submitted it too late), but I'm kinda proud of it.<br><br>`,
            href: `https://illuminate-omegaorbitals.glitch.me`,
            target: "_blank"
          }
        },
        {
          args: {
            innerText: `That's it unfortunately, most of my projects are still unfinished.`
          }
        }
      ])
    }
  },
  {
    aliases: ["guessthenumber", "gtn"],
    description: "Play guess the number",
    category: "Games",
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
    aliases: ["get"],
    description: "Do a GET request on a website",
    category: "Web",
    run: async (command) => {
      let url = command.split(" ")[1];
      fetch(url, {
        method: "GET"
      })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        output([
          {
            args: {
              innerText: text
            }
          }
        ])
      })
      .catch((error) => {
        output([
          {
            args: {
              innerText: error
            }
          }
        ])
      })
    }
  }
]
