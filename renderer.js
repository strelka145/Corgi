const fs = require('fs');
const path = require('path');

const jsonFilePath = path.join(__dirname, 'data.json');

let data = [];

function loadData() {
  try {
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    data = JSON.parse(jsonData);
  } catch (error) {
    console.log(error);
  }
}

function saveData() {
  try {
    const jsonData = JSON.stringify(data);
    fs.writeFileSync(jsonFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.log(error);
  }
}

function renderList() {
  const listEl = document.getElementById('list');
  listEl.innerHTML = '';
  [...data].reverse().forEach((item) => {
    const liEl = document.createElement('li');
    const liDiv = document.createElement('div');
    liDiv.classList.add('time');
    const dateEl = document.createTextNode(`${item.time}`);
    liDiv.appendChild(dateEl);
    const liP = document.createElement('p');
    const textEl = document.createTextNode(`${item.input}`);
    liP.appendChild(textEl);
    liEl.appendChild(liDiv);
    liEl.appendChild(liP);
    listEl.appendChild(liEl);
  });
}

function onSubmit(event) {
  event.preventDefault();
  const inputEl = document.getElementById('inputbox');
  const input = inputEl.value.trim();
  const time = new Date().toLocaleString();
  data.push({ time, input });
  saveData();
  renderList();
  inputEl.value = '';
}

loadData();
renderList();

const submitBtnEl = document.getElementById('submit-btn');
submitBtnEl.addEventListener('click', onSubmit);

// レンダラープロセス
const { ipcRenderer } = require('electron');

const list = document.querySelector('#list');

list.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  console.log(event.target.parentNode.textContent);

  // リストの要素を右クリックしたときに送信するデータ
  const data = { 
    index: Array.from(list.children).indexOf(event.target),
    date: event.target.parentNode.querySelector('div').textContent,
    text: event.target.parentNode.querySelector('p').textContent
  };
  console.log(data);


  // メインプロセスにデータを送信
  ipcRenderer.send('show-context-menu', data);
});


ipcRenderer.on('deleteItem', (event, rcvData) => {
  data = data.filter(item => item.time !== rcvData.date || item.input !== rcvData.text);
  saveData();
  renderList();
});

    
  

