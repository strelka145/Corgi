const fs = require('fs');
const path = require('path');
const jsonFilePath = path.join(__dirname, 'data.json');
const {
  ipcRenderer
} = require('electron');
let data = [];

//Align inputbox width
var btnSpanWidth = document.querySelector('a.btn-border span').offsetWidth;
var inputBox = document.querySelector('input[type="text"]');
inputBox.style.width = btnSpanWidth + 'px';

//Function to return a hash
//To assign a unique ID to each element in the list.
function hashStringSha1(text){
  hashAlgorithm = 'SHA-1';
  const hashFunction = window.crypto.subtle.digest.bind(window.crypto.subtle, hashAlgorithm);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = hashFunction(data);
  //Convert hash to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function loadData() {
  ipcRenderer.send('loadData', data);
}

function saveData() {
  try {
    const jsonData = JSON.stringify(data);
    ipcRenderer.send('saveData', data);
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
  data.push({
    time,
    input
  });
  saveData();
  renderList();
  inputEl.value = '';
}
loadData();
const submitBtnEl = document.getElementById('submit-btn');
submitBtnEl.addEventListener('click', onSubmit);
// レンダラープロセス
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
ipcRenderer.on('loadData', (event, jsonData) => {
  data = jsonData;
  renderList();
});
