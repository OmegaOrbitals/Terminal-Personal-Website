const inputTextElem = document.querySelector("#inputText");
let caretElem = document.querySelector("#caret");
const inputTextarea = document.querySelector("#inputTextarea");
const outputElem = document.querySelector("#output");
const terminalElem = document.querySelector("#terminal");
const promptElem = document.querySelector("#prompt");
const contextElem = document.querySelector("#contextmenu");

let keys = {
  shift: false,
  ctrl: false
}

let commandHistory = [];
let commandHistoryIndex = -1;
let reading = false;
let isInShell = false;
let readPromiseResolve;
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
let caretInterval;
let contextButtons = {};
let inputText;
let caretPos = { start: null, end: null };

let utils = {
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  clear: () => {
    outputElem.innerHTML = "";
  }
}

for(let button of contextElem.children) {
  contextButtons[button.id] = button;
}

contextButtons["copy"].addEventListener("click", (ev) => {
  navigator.clipboard.writeText(window.getSelection().toString())
  .then(() => {
    hideContextmenu();
  })
})

contextButtons["paste"].addEventListener("click", (ev) => {
  navigator.clipboard.readText()
  .then((text) => {
    inputTextarea.value += text;
    updateInputText();
    hideContextmenu();
  })
})

String.prototype.replaceAt = function(start, length, replacement) {
  return this.substring(0, start) + replacement + this.substring(start + length);
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

function scrollToEnd() {
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight
    })
  }, 0)
}

function updateInputText() {
  inputText = inputTextarea.value;
  inputTextElem.innerText = inputText;
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
    outputElem.append(lineElem);
    scrollToEnd();
  }
}

function updateCaret(newCmd) {
  setTimeout(() => {
    if(caretPos.start == inputTextarea.selectionStart && caretPos.end == inputTextarea.selectionEnd && !newCmd) return;
    caretPos.start = inputTextarea.selectionStart;
    caretPos.end = inputTextarea.selectionEnd;
    if(!inputText) {
      inputTextElem.innerHTML = `<span id="caret" style="background-color: white; color: black;">&nbsp;</span>`;
      caretElem = document.querySelector("#caret");
      return setCaretInterval();
    }
    let caretStr = inputText.substring(inputTextarea.selectionStart, inputTextarea.selectionEnd + (inputTextarea.selectionStart == inputTextarea.selectionEnd ? 1 : 0));
    if(!caretStr) caretStr = "&nbsp;";
    let caretSpan = `<span id="caret" style="background-color: white; color: black;">${caretStr}</span>`;
    let inputTextHTML = inputText.replaceAt(inputTextarea.selectionStart, caretStr.length, caretSpan);
    if(inputTextHTML == inputTextElem.innerHTML) return;
    inputTextElem.innerHTML = inputTextHTML;
    caretElem = document.querySelector("#caret");
    setCaretInterval();
  }, 0)
}

function moveToEnd(el) {
  if(typeof el.selectionStart == "number") {
    el.selectionStart = el.selectionEnd = el.value.length;
  } else if(typeof el.createTextRange != "undefined") {
    el.focus();
    var range = el.createTextRange();
    range.collapse(false);
    range.select();
  }
}

function showContextmenu(ev) {
  contextElem.style.left = ev.clientX + "px";
  contextElem.style.top = ev.clientY + window.scrollY + "px";
  contextElem.style.display = "flex";
  const selection = window.getSelection();
  if(selection.rangeCount > 0 && selection.toString()) {
    contextButtons["copy"].style.display = "block";
  } else {
   contextButtons["copy"].style.display = "none";
  }
}

function hideContextmenu() {
  contextElem.style.display = "none";
}

function setCaretInterval() {
  if(caretInterval) {
    clearInterval(caretInterval);
  }
  caretElem.style["background-color"] = "white";
  caretInterval = setInterval(() => {
    if(inputTextarea.selectionStart != inputTextarea.selectionEnd) return;
    caretElem.style["background-color"] = caretElem.style["background-color"] == "white" ? "transparent" : "white";
    caretElem.style["color"] = caretElem.style["background-color"] == "white" ? "black" : "white";
  }, 500)
}

document.addEventListener("keydown", async (ev) => {
  if(document.activeElement == document.body && !window.getSelection().toString()) {
    inputTextarea.focus();
    scrollToEnd();
  }
  updateCaret();
  if(ev.key == "Enter") {
    updateCaret(true);
    setCaretInterval();
    if(keys.shift) return;
    ev.preventDefault();
    let inputValue = inputTextarea.value;
    inputTextarea.value = "";
    updateInputText();
    if(reading == false) output({ innerText: "$ ", style: "color: lightgreen;" });
    if(inputValue || reading) output({ innerText: inputValue + "\n" });
    isInShell = false;
    promptElem.style.display = "none";
    if(reading == false) {
      const lines = inputValue.replaceAll(";", "\n").split("\n");
      for(let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let untrimmed = line;
        let isCommand = false;
        line = line.trim();
        for(let command of commands) {
          for(let alias of command.aliases) {
            if(line.split(" ")[0] == alias) {
              await command.run(line, command.aliases);
              isCommand = true;
            }
          }
        }

        console.log("fin")
        if(!isCommand && line != "") {
          output({ innerText: `Command '${line.split(" ")[0]}' not found.` });
        }
        if(commandHistory[commandHistory.length - 1] != line && !untrimmed.startsWith(" ") && line) {
          commandHistory.push(line);
          commandHistoryIndex = commandHistory.length;
        }
        isInShell = true;
        promptElem.style.display = "inline";
        if(line != "" || lines < 1) output({ innerText: "\n" });
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
    updateInputText();
    moveToEnd(inputTextarea);
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
    updateInputText();
    moveToEnd(inputTextarea);
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

window.addEventListener("load", () => {
  inputTextarea.focus();
  scrollToEnd();
})

inputTextarea.addEventListener("input", (ev) => {
  updateInputText();
  scrollToEnd();
})

inputTextarea.addEventListener("blur", (ev) => {
  caretPos = { start: null, end: null };
  clearInterval(caretInterval);
  caretElem.style["background-color"] = "transparent";
  caretElem.style["color"] = "white";
})

inputTextarea.addEventListener("focus", (ev) => {
  updateCaret();
})

terminalElem.addEventListener("contextmenu", (ev) => {
  if(keys.ctrl == false) {
    ev.preventDefault();
    showContextmenu(ev);
  }
})

document.addEventListener("click", (ev) => {
  if(document.activeElement == document.body && !window.getSelection().toString()) {
    inputTextarea.focus();
    scrollToEnd();
  }
})

document.addEventListener("mousedown", (ev) => {
  if(!contextElem.contains(ev.target)) hideContextmenu();
})

document.addEventListener("touchend", (ev) => {
  if(document.activeElement == document.body) {
    inputTextarea.focus();
    scrollToEnd();
  }
})

output({ innerText: "Welcome to my personal website!\nType 'help' for a list of commands.\n" });
setCaretInterval();

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
      output({ innerText: res.slice(0, -1) });
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
      output({ innerText: res.slice(0, -1) });
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
      output({ innerText: window.location.href, href: window.location.href });
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
      output({
        innerText: `I don't have that many completed projects, but here are some of them.`
      },
      {
        innerHTML: `<br>Terminal Personal Website - my personal website. It's not just themed like a terminal, it IS a terminal!<br><br>`,
        href: `https://github.com/OmegaOrbitals/Terminal-Personal-Website`,
      },
      {
        innerHTML: `Tackpad - this lets you control a cursor using a touchscreen device. Like a trackpad! Extremely buggy.<br><br>`,
        href: `https://github.com/OmegaOrbitals/tackpad`,
      },
      {
        innerHTML: `Illuminate - a website I made for the Illuminate hackathon. I didn't win (I think I submitted it too late), but I'm kinda proud of it.<br><br>`,
        href: `https://illuminate-omegaorbitals.glitch.me`,
      },
      {
        innerText: `That's it unfortunately, most of my projects are still unfinished.`
      })
    }
  },
  {
    aliases: ["clear"],
    description: "Clear the terminal",
    category: "General",
    run: async () => {
      utils.clear();
    }
  },
  {
    aliases: ["guessthenumber", "gtn"],
    description: "Play guess the number",
    category: "Fun",
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
    aliases: ["starwars"],
    description: "Watch Star Wars: A New Hope in ASCII",
    category: "Fun",
    run: async () => {
      await fetch("/starwars")
      .then((res) => {
        return res.text();
      })
      .then(async (text) => {
        const LINES_PER_FRAME = 14;
        const DELAY = 67;
        const filmData = text.split("\n");
        for(let i = 0; i < filmData.length; i += LINES_PER_FRAME) {
          utils.clear();
          output({ innerHTML: filmData.slice(i + 1, i + LINES_PER_FRAME).join("<br>").replaceAll(" ", "&nbsp;") })
          await utils.delay(parseInt(filmData[i], 10) * 67);
        }
      })
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
