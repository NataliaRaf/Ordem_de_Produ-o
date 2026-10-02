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

}catch(err){
console.error(err);
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


let produtoBase = normalizarProduto(nomeProduto);

let partes = variacao.split(",");

let coresTexto = partes[0].trim();
let tamanho = partes.length > 1 ? partes[1].trim().toUpperCase() : "";

let cores = coresTexto.split("+").map(c => c.trim()).filter(c => c);

cores.forEach(cor => {

let valor = quantidade;
let chave = produtoBase + "|" + cor + "|" + tamanho;

resultado[chave] = (resultado[chave] || 0) + valor;

totalGeral += valor;
totalProduto[produtoBase] = (totalProduto[produtoBase] || 0) + valor;
totalCor[cor] = (totalCor[cor] || 0) + valor;

listaProdutos.add(produtoBase);

});

});


dadosProcessados = Object.keys(resultado).map(chave => {

let partes = chave.split("|");

return {
produto: partes[0],
cor: partes[1],
tamanho: partes[2],
quantidade: resultado[chave]
};

});


atualizarTabela("todos");

document.getElementById("totalGeral").innerText = totalGeral;

document.getElementById("totalPorProduto").innerHTML =
Object.keys(totalProduto).map(p => p + ": " + totalProduto[p]).join("<br>");

document.getElementById("totalPorCor").innerHTML =
Object.keys(totalCor).map(c => c + ": " + totalCor[c]).join("<br>");

filtroProduto.innerHTML = '<option value="todos">Todos</option>';

listaProdutos.forEach(p => {
filtroProduto.innerHTML += '<option value="'+p+'">'+p+'</option>';
});

document.getElementById("dataRelatorio").innerText =
"Data: " + new Date().toLocaleDateString("pt-BR");

dadosPlanilhaAnterior = JSON.parse(JSON.stringify(dadosPlanilha));

});


filtroProduto.addEventListener("change", function () {
atualizarTabela(this.value);
});


function normalizarProduto(nome){

    nome = nome.toLowerCase();

    if(nome.includes("conjunto") || nome.includes("kit")){

        if(nome.includes("camiseta")){
            return "Conjunto Camiseta";
        }

        if(nome.includes("camisa")){
            return "Conjunto Camisa";
        }

        if(nome.includes("blusa")){
            return "Conjunto Blusa";
        }

        if(nome.includes("colete")){
            return "Conjunto Colete";
        }

        return "Conjunto";
    }

    if(nome.includes("calça")){
        return "Calça";
    }

    se(nome.inclui("colete") && nome.inclui("shorts")){
    retornar "Conjunto Colete Shorts";
}

se(nome.inclui("colete") && nome.inclui("calça")){
    retornar "Conjunto Colete Calça";
}

se(nome.inclui("colete")){
    retornar "Conjunto Colete";
}

    if(nome.includes("vestido")){
        return "Vestido";
    }

    if(nome.includes("saia")){
        return "Saia";
    }

    if(nome.includes("short")){
        return "Short";
    }

    return nome.trim();
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

tbody.innerHTML += '<tr class="produto-bloco"><td colspan="4">'+produto+'</td></tr>';

let tamanhos = produtos[produto];

Object.keys(tamanhos)
.sort((a,b)=>ordemTamanhos.indexOf(a)-ordemTamanhos.indexOf(b))
.forEach(tamanho => {

tbody.innerHTML += '<tr class="tamanho-bloco"><td colspan="4">Tamanho '+tamanho+'</td></tr>';

Object.keys(tamanhos[tamanho]).forEach(cor => {

let quantidade = tamanhos[tamanho][cor];

tbody.innerHTML += '<tr><td></td><td>'+cor+'</td><td>'+tamanho+'</td><td>'+quantidade+'</td></tr>';

});

});

});

}

btnRelatorio.addEventListener("click", function () {
window.print();
});

});
