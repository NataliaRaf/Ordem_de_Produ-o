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

const data = new Uint8Array(event.target.result);
const workbook = XLSX.read(data, { type: "array" });
const sheet = workbook.Sheets[workbook.SheetNames[0]];

dadosPlanilha = XLSX.utils.sheet_to_json(sheet);

};

reader.readAsArrayBuffer(file);

});


btnProcessar.addEventListener("click", function () {

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
let tamanho = partes.length > 1 ? partes[1].trim().toUpperCase() : "";

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


function normalizarProduto(nome){

nome = nome.toLowerCase();

// jaleco
if(nome.includes("jaleco")) return "Jaleco";

// calça avulsa
if(nome.includes("calça") && !nome.includes("conjunto") && !nome.includes("kit")) return "Calça";

// colete avulso
if(nome.includes("colete") && !nome.includes("conjunto") && !nome.includes("kit")) return "Colete";

// conjunto ou kit
if(nome.includes("conjunto") || nome.includes("kit")) return "Conjunto";

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
let tamanho = partes.length > 1 ? partes[1].trim().toUpperCase() : "";

let cores = coresTexto
.split("+")
.map(c => c.trim())
