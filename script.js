document.addEventListener("DOMContentLoaded", function () {

    let dadosPlanilha = [];
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

            let produtoOriginal = (linha["Nome do Produto"] || "").toLowerCase();
            let variacao = linha["Nome da variação"] || "";
            let quantidade = Number(linha["Quantidade"]) || 0;

            if (!produtoOriginal || !variacao || quantidade === 0) return;

            let multiplicador = 1;
            let produtoBase = "";

            // 🔹 LÓGICA ORIGINAL MANTIDA
            if (produtoOriginal.includes("kit 3")) {
                multiplicador = 3;
                produtoBase = "Conjunto";
            }
            else if (produtoOriginal.includes("kit 2")) {
                multiplicador = 2;
                produtoBase = "Conjunto";
            }
            else if (produtoOriginal.includes("conjunto")) {
                produtoBase = "Conjunto";
            }
            else if (produtoOriginal.includes("calça")) {
                produtoBase = "Calça";
            }
            else if (produtoOriginal.includes("colete")) {
                produtoBase = "Colete";
            }
            else {
                // Qualquer outro produto novo
                produtoBase = linha["Nome do Produto"];
            }

            let partes = variacao.split(",");
            let coresTexto = partes[0];
            let tamanho = partes[1] ? partes[1].trim().toUpperCase() : "";

            let cores = coresTexto.split("+");

            cores.forEach(cor => {

                cor = cor.trim();

                // 🔹 DIVISÃO CORRETA DOS KITS
                let valor = (quantidade * multiplicador) / cores.length;

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

    });

    filtroProduto.addEventListener("change", function () {
        atualizarTabela(this.value);
    });

    function atualizarTabela(filtro) {

        const tbody = document.querySelector("#tabela tbody");
        tbody.innerHTML = "";

        let dadosFiltrados = filtro === "todos"
            ? dadosProcessados
            : dadosProcessados.filter(d => d.produto === filtro);

        dadosFiltrados.forEach(d => {

            let row = `
                <tr>
                    <td>${d.produto}</td>
                    <td>${d.cor}</td>
                    <td>${d.tamanho}</td>
                    <td>${d.quantidade}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        });
    }

    btnRelatorio.addEventListener("click", function () {
        window.print();
    });

});