document.addEventListener("DOMContentLoaded", function () {

let dadosPlanilha = [];
let dadosPlanilhaAnterior = [];
let dadosProcessados = [];

const upload = document.getElementById("upload");
const btnProcessar = document.getElementById("btnProcessar");
const btnRelatorio = document.getElementById("btnRelatorio");
const filtroProduto = document.getElementById("filtroProduto");


upload.addEventListener("change", function (e) {

const file = e.target.files[0];
if (!file) return;

const reader = new FileReader();

reader.onload = function (event) {

try{

const data = new Uint8Array(event.target.result);
const workbook = XLSX.read(data, { type: "array" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

dadosPlanilha = XLSX.utils.sheet_to_json(sheet);

console.log("Planilha carregada:", dadosPlanilha);

}catch(err){
console.error("Erro ao ler planilha:", err);
alert("Erro ao carregar a planilha.");
}

};

reader.readAsArrayBuffer(file);

});


btnProcessar.addEventListener("click", function () {

if(dadosPlanilha.length === 0){
alert("Carregue uma planilha primeiro.");
return;
}

let resultado = {};
let totalGeral = 0;
let totalProduto = {};
let totalCor = {};
let listaProdutos = new Set();

dadosPlanilha.forEach(linha => {

let nomeProduto = (linha["Nome do Produto"] || "").toLowerCase();
let variacao = linha["Nome da variação"] || "";
let quantidade = Number(linha["Quantidade"]) || 0;

if (!nomeProduto || !variacao || quantidade === 0) return;

let multiplicador = 1;

if (nomeProduto.includes("kit 3")) multiplicador = 3;
if (nomeProduto.includes("kit 2")) multiplicador = 2;

let produtoBase = normalizarProduto(nomeProduto);

let partes = variacao.split(",");

let coresTexto = partes[0].trim();
let tamanho = partes[1] ? partes[1].trim().toUpperCase() : "";

let cores = coresTexto
.split("+")
.map(c => c.trim())
.filter(c => c.length > 0);

cores.forEach(cor => {

let valor;

if(produtoBase === "Conjunto"){
valor = (quantidade * multiplicador) / cores.length;
}else{
valor = quantidade;
}

let chave = `${produtoBase}|${cor}|${tamanho}`;

resultado[chave] = (resultado[chave] || 0) + valor;

totalGeral += valor;

totalProduto[produtoBase] = (totalProduto[produtoBase] || 0) + valor;

totalCor[cor] = (totalCor[cor] || 0) + valor;

listaProdutos.add(produtoBase);

});

});


dadosProcessados = Object.entries(resultado).map(item => {

let partes = item[0].split("|");

return {
produto: partes[0],
cor: partes[1],
tamanho: partes[2],
quantidade: item[1]
};

});


atualizarTabela("todos");

document.getElementById("totalGeral").innerText = totalGeral;

document.getElementById("totalPorProduto").innerHTML =
Object.entries(totalProduto).map(p => `${p[0]}: ${p[1]}`).join("<br>");

document.getElementById("totalPorCor").innerHTML =
Object.entries(totalCor).map(c => `${c[0]}: ${c[1]}`).join("<br>");

filtroProduto.innerHTML = '<option value="todos">Todos os Produtos</option>';

listaProdutos.forEach(p => {
filtroProduto.innerHTML += `<option value="${p}">${p}</option>`;
});

document.getElementById("dataRelatorio").innerText =
"Data: " + new Date().toLocaleDateString("pt-BR");

gerarAlertaProducao();

dadosPlanilhaAnterior = JSON.parse(JSON.stringify(dadosPlanilha));

});


filtroProduto.addEventListener("change", function () {
atualizarTabela(this.value);
});



/* NOVA FUNÇÃO DE CLASSIFICAÇÃO MAIS SEGURA */

function normalizarProduto(nome){

nome = nome.toLowerCase();

const regras = [
{tipo:"Jaleco", palavras:["jaleco"]},
{tipo:"Conjunto", palavras:["conjunto"]},
{tipo:"Conjunto", palavras:["kit"]},
{tipo:"Calça", palavras:["calça"]},
{tipo:"Colete", palavras:["colete"]}
];

for(let regra of regras){

for(let palavra of regra.palavras){

if(nome.includes(palavra)){

// evita kit jaleco virar conjunto
if(regra.tipo === "Conjunto" && nome.includes("jaleco")){
return "Jaleco";
}

return regra.tipo;

}

}

}

return "Outros";

}



function gerarAlertaProducao(){

const alerta = document.getElementById("alertaProducao");

if(!dadosPlanilhaAnterior.length){
alerta.innerHTML="";
return;
}

let mapaAnterior = {};
let mapaAtual = {};

function montarMapa(planilha,mapa){

planilha.forEach(linha=>{

let produto = normalizarProduto(linha["Nome do Produto"] || "");
let variacao = linha["Nome da variação"] || "";
let quantidade = Number(linha["Quantidade"]) || 0;

if(!variacao) return;

let partes = variacao.split(",");

let coresTexto = partes[0].trim();
let tamanho = partes[1] ? partes[1].trim().toUpperCase() : "";

let cores = coresTexto
.split("+")
.map(c => c.trim())
.filter(c => c.length > 0);

cores.forEach(cor=>{

let chave = `${produto}|${tamanho}|${cor}`;

mapa[chave] = (mapa[chave] || 0) + quantidade;

});

});

}

montarMapa(dadosPlanilhaAnterior,mapaAnterior);
montarMapa(dadosPlanilha,mapaAtual);

let estrutura = {};

Object.keys(mapaAtual).forEach(chave=>{

let antes = mapaAnterior[chave] || 0;
let agora = mapaAtual[chave];

let diferenca = agora - antes;

if(diferenca <= 0) return;

let partes = chave.split("|");

let produto = partes[0];
let tamanho = partes[1];
let cor = partes[2];

if(!estrutura[produto]) estrutura[produto] = {};
if(!estrutura[produto][tamanho]) estrutura[produto][tamanho] = [];

estrutura[produto][tamanho].push(`${cor}(${diferenca})`);

});

let html = "<h3>⚠ Corte necessário</h3>";

Object.keys(estrutura).forEach(produto=>{

html += `<div style="margin-top:10px;font-weight:bold;">${produto}</div>`;

Object.keys(estrutura[produto]).forEach(tamanho=>{

let cores = estrutura[produto][tamanho].join(" ");

html += `<div style="margin-left:10px;">${tamanho} → ${cores}</div>`;

});

});

alerta.innerHTML = html;

}



function atualizarTabela(filtro){

const tbody = document.querySelector("#tabela tbody");
tbody.innerHTML = "";

let dadosFiltrados = filtro === "todos"
? dadosProcessados
: dadosProcessados.filter(d => d.produto === filtro);

let produtos = {};

dadosFiltrados.forEach(item => {

if (!produtos[item.produto]) produtos[item.produto] = {};
if (!produtos[item.produto][item.tamanho]) produtos[item.produto][item.tamanho] = {};
if (!produtos[item.produto][item.tamanho][item.cor]) produtos[item.produto][item.tamanho][item.cor] = 0;

produtos[item.produto][item.tamanho][item.cor] += item.quantidade;

});

const ordemTamanhos = ["PP","P","M","G","GG","XG","XXG"];

Object.keys(produtos).forEach(produto => {

tbody.innerHTML += `
<tr class="produto-bloco">
<td colspan="4">${produto}</td>
</tr>
`;

let tamanhos = produtos[produto];

Object.keys(tamanhos)
.sort((a,b)=>ordemTamanhos.indexOf(a)-ordemTamanhos.indexOf(b))
.forEach(tamanho => {

tbody.innerHTML += `
<tr class="tamanho-bloco">
<td colspan="4">Tamanho ${tamanho}</td>
</tr>
`;

Object.keys(tamanhos[tamanho]).forEach(cor => {

let quantidade = tamanhos[tamanho][cor];

tbody.innerHTML += `
<tr>
<td></td>
<td>${cor}</td>
<td>${tamanho}</td>
<td>${quantidade}</td>
</tr>
`;

});

});

});

}


btnRelatorio.addEventListener("click", function () {
window.print();
});

});
