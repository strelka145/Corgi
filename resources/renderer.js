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
const submitBtnEl = document.getElementById('submit-btn');

loadData();

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

//Get a random string to assign a unique ID to the html element.
function getRandomID(){
  idBase64="id"+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(40)))).substring(0,40);
  idHtml=idBase64.replace(/=/g, '.').replace(/\//g, '_').replace(/\+/g, '-');
  return idHtml;
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
    liEl.setAttribute('id',getRandomID() );
    const liDiv = document.createElement('div');
    liDiv.classList.add('time');
    const dateEl = document.createTextNode(`${item.time}`);
    liDiv.appendChild(dateEl);
    const liP = document.createElement('p');
    liP.setAttribute('ondblclick','makeEditable(this.parentNode.id)' );
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

function id2DataIndex(serchID){
  const listItems = document.querySelectorAll('li');
  let itemIndex = -1;
  for (let i = 0; i < listItems.length; i++) {
    if (listItems[i].id === serchID) { // 目的の要素を見つけた場合
      itemIndex = i; // その要素のインデックスを保存
      break;
    }
  }
  return listItems.length-1-itemIndex;
}

function makeEditable(elemID) {
  var p = document.getElementById(elemID).querySelector('p');
  var text = p.innerHTML;
  var input = document.createElement("input");
  input.setAttribute("value", text);
  p.parentNode.replaceChild(input, p);
  input.focus();
  input.onblur = function() {
    p.innerHTML = this.value;
    this.parentNode.replaceChild(p, this);
    data[id2DataIndex(elemID)].input=p.innerHTML;
    saveData();
  }
}



ipcRenderer.on('deleteItem', (event, rcvData) => {
  const indexToRemove = data.findIndex(item => item.time === rcvData.date && item.input === rcvData.text);
  if (indexToRemove >= 0) {
    data.splice(indexToRemove, 1);
  }
  saveData();
  renderList();
});
ipcRenderer.on('loadData', (event, jsonData) => {
  data = jsonData;
  renderList();
});
