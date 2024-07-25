const inputText = document.querySelector("#inputText");
const inputTextarea = document.querySelector("#inputTextarea");
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
let filesystem = {
  name: "/",
  type: "root",
  contents: [
    {
      name: "documents",
      type: "directory",
      contents: [
        {
          name: "document.pdf",
          type: "file"
        }
      ]
    }
  ]
}

function getPathDestination(path) {
  let destination = filesystem;
  if(path == "/") return destination;
  for(let item of path.split("/")) {
    destination = destination[item];
  }
  return destination;
}

function createFile(path, name) {
  let destination = getPathDestination(path);
  if(destination.type != "directory" && destination.type != "root") return;
  destination.contents.push({
    name: name,
    type: "file"
  })
}

function createDir(path, name) {
  let destination = getPathDestination(path);
  if(destination.type != "directory" && destination.type != "root") return;
  destination.contents.push({
    name: name,
    type: "directory"
  })
}

function read(prompt) {
  output({ innerText: prompt });
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

function output(...elements) {
  for(let element of elements) {
    let lineElem = document.createElement("span");
    if(element["href"]) {
      lineElem.classList.add("link");
      lineElem.addEventListener("click", (ev) => {
        window.open(element["href"]);
      })
    }
    for(let arg in element) {
      lineElem[arg] = element[arg];
    }
    textElem.append(lineElem);
    textElem.append(inputText);
    onTerminalResize();
  }
}

function changeInputSize() {
  inputTextarea.style.height = "5px";
  inputTextarea.style.height = (inputTextarea.scrollHeight) + "px";
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
  if(document.activeElement == document.body && !window.getSelection().toString()) inputTextarea.focus();
  if(ev.key == "Enter") {
    if(keys.shift) return;
    ev.preventDefault();
    let inputValue = inputTextarea.value;
    if(inputValue) output({ innerText: inputValue + "\n" });
    inputTextarea.value = "";
    inputText.innerText = inputTextarea.value;
    changeInputSize();
    if(reading == false) {
      const lines = inputValue.replaceAll(";", "\n").split("\n");
      for(let line of lines) {
        let untrimmed = line;
        line = line.trim();
        let isCommand = false;
        isInShell = false;
        for(let command of commands) {
          for(let alias of command.aliases) {
            if(line.split(" ")[0] == alias) {
              await command.run(line, command.aliases);
              isCommand = true;
            }
          }
        }
        if(!isCommand && line != "") {
          output({ innerText: `Command '${line.split(" ")[0]}' not found.` });
        }
        isInShell = true;
        output({ innerText: "\n$ ", style: "color: lightgreen" });
        if(commandHistory[commandHistory.length - 1] != line && !untrimmed.startsWith(" ") && line) {
          commandHistory.push(line);
          commandHistoryIndex = commandHistory.length;
        }
      }
    } else {
      newInput(inputValue);
    }
  }
  if(ev.key == "ArrowUp") {
    ev.preventDefault();
    if(commandHistoryIndex - 1 < 0) return;
    commandHistoryIndex -= 1;
    inputTextarea.value = commandHistory[commandHistoryIndex];
    inputText.innerText = inputTextarea.value;
    changeInputSize();
    autoscroll(inputTextarea);
  }
  if(ev.key == "ArrowDown") {
    ev.preventDefault();
    if(commandHistoryIndex < commandHistory.length - 1) {
      commandHistoryIndex += 1;
      inputTextarea.value = commandHistory[commandHistoryIndex];
    } else {
      commandHistoryIndex = commandHistory.length;
      inputTextarea.value = "";
    }
    inputText.innerText = inputTextarea.value;
    changeInputSize();
    autoscroll(inputTextarea);
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

inputTextarea.addEventListener("input", (ev) => {
  inputText.innerText = inputTextarea.value;
  changeInputSize();
})

document.addEventListener("click", (ev) => {
  if(document.activeElement == document.body && !window.getSelection().toString()) inputTextarea.focus();
})

document.addEventListener("touchend", (ev) => {
  if(document.activeElement == document.body) inputTextarea.focus();
})


changeInputSize();
output({ innerText: "Welcome to my personal website!\nType 'help' for a list of commands." });
output({ innerText: "\n$ ", style: "color: lightgreen" });

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
      output({ innerText: res });
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
      output({ innerText: res });
    }
  },
  {
    aliases: ["touch", "createfile", "newfile"],
    description: "Creates a file",
    run: async () => {
      let path = await read("Full path of parent directory: ")
      let name = await read("Name of file: ")
      createFile(path, name);
    }
  },
  {
    aliases: ["linktest"],
    run: async () => {
      output({ innerText: "Links are a WIP :(" });
    }
  },
  {
    aliases: ["about", "aboutme"],
    description: "About me",
    category: "Personal",
    run: async () => {
      output({ innerText: `I'm Omega. I do webdev, Node and Python. I enjoy programming, reading and gaming.\nThis website was made for Hack Club's arcade. This was just meant to be a quick terminal-themed personal website, but I had so much fun making it, so I made a whole command system (aka tortured myself with async/await & Promises). This has command history, blocking input reading, and more. I'm also planning on adding a lot more commands and maybe a command builder.` });
    }
  },
  {
    aliases: ["projects"],
    description: "My projects",
    category: "Personal",
    run: async () => {
      /* output({
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
      }) */
    }
  },
  {
    aliases: ["guessthenumber", "gtn"],
    description: "Play guess the number",
    category: "Games",
    run: async () => {
      let playing = true;
      while(playing) {
        let number = Math.floor(Math.random() * 100);
        let text = await read(`Enter a number from 0 to 100: `);
        if(isNaN(text)) {
          text = await read(`Not a number! Try again? `);
        } else {
          text = await read(`You ${number == text ? "win" : "lose"}, it was ${number}. Try again? `);
        }
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
      let url = "https://corsproxy.io/?" + encodeURIComponent(command.split(" ")[1]);
      await fetch(url, {
        method: "GET"
      })
      .then((res) => {
        if(!res.ok) {
          throw new Error("Failed:", res);
        } else {
          return res.text();
        }
      })
      .then((text) => {
        output({ innerText: text });
      })
      .catch((error) => {
        output({ innerText: error });
      })
    }
  }
]
