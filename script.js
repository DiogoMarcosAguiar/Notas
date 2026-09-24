// Array para armazenar os itens do pedido atual
let itensPedido = [];
let descontoAplicado = 0;

// Inicialização ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("dataAtual").innerText = new Date().toLocaleDateString("pt-BR");
  
  // Carrega histórico do localStorage
  renderizarHistorico();
  
  if (!document.getElementById("inputNumPedido").value) {
    document.getElementById("inputNumPedido").value = "001";
    atualizarDadosCliente();
  }
});

// Mensagem discreta na tela (Sem alert)
function mostrarMensagem(texto, tipo = "sucesso") {
  const msgEl = document.getElementById("statusMsg");
  msgEl.innerText = texto;
  msgEl.style.backgroundColor = tipo === "sucesso" ? "#28a745" : "#dc3545";
  msgEl.style.color = "#fff";
  msgEl.style.padding = "10px 15px";
  msgEl.style.borderRadius = "5px";
  msgEl.style.marginBottom = "15px";
  msgEl.style.textAlign = "center";
  msgEl.style.display = "block";

  setTimeout(() => {
    msgEl.style.display = "none";
  }, 3500);
}

// Atualiza informações do cabeçalho
function atualizarDadosCliente() {
  const numPedido = document.getElementById("inputNumPedido").value || "---";
  const nome = document.getElementById("nomeCliente").value.trim();
  const loja = document.getElementById("lojaCliente").value.trim();

  document.getElementById("numPedidoView").innerText = numPedido;

  const clienteContainer = document.getElementById("clienteContainer");
  const clienteView = document.getElementById("clienteView");
  const lojaView = document.getElementById("lojaView");

  if (nome || loja) {
    clienteContainer.style.display = "block";
    clienteView.innerHTML = nome ? `<strong>Cliente:</strong> ${nome}` : "";
    lojaView.innerHTML = loja ? `<strong>Loja:</strong> ${loja}` : "";
  } else {
    clienteContainer.style.display = "none";
  }
}

// Prévia do item sendo digitado
function calcularPreviaItem() {
  const qtd = parseFloat(document.getElementById("qtd").value) || 0;
  const unit = parseFloat(document.getElementById("valorUnit").value) || 0;
  const total = qtd * unit;
  document.getElementById("previaTotalItem").innerText = total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// Adiciona um item ao pedido
function adicionarItem() {
  const codigo = document.getElementById("codigo").value.trim() || "---";
  const descricao = document.getElementById("descricao").value.trim();
  const qtd = parseFloat(document.getElementById("qtd").value) || 0;
  const valorUnit = parseFloat(document.getElementById("valorUnit").value) || 0;

  if (!descricao || qtd <= 0 || valorUnit <= 0) {
    mostrarMensagem("Preencha a descrição, quantidade e valor unitário!", "erro");
    return;
  }

  itensPedido.push({
    id: Date.now(),
    codigo,
    descricao,
    qtd,
    valorUnit,
    total: qtd * valorUnit
  });

  // Limpa campos
  document.getElementById("codigo").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("qtd").value = "1";
  document.getElementById("valorUnit").value = "";
  document.getElementById("previaTotalItem").innerText = "0,00";

  renderizarTabela();
}

// Remove item da lista
function removerItem(id) {
  itensPedido = itensPedido.filter(item => item.id !== id);
  renderizarTabela();
}

// Aplica desconto
function aplicarDesconto() {
  descontoAplicado = parseFloat(document.getElementById("descontoInput").value) || 0;
  atualizarResumoValores();
  mostrarMensagem("Desconto aplicado!");
}

// Renderiza a tabela da nota
function renderizarTabela() {
  const corpoTabela = document.getElementById("corpoTabela");
  corpoTabela.innerHTML = "";

  itensPedido.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td>${item.qtd}</td>
      <td>R$ ${item.valorUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td>R$ ${item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td class="coluna-acao">
        <button style="background: #dc3545; color: #fff; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;" onclick="removerItem(${item.id})">X</button>
      </td>
    `;
    corpoTabela.appendChild(tr);
  });

  atualizarResumoValores();
}

// Atualiza totais
function atualizarResumoValores() {
  const subtotal = itensPedido.reduce((acc, item) => acc + item.total, 0);
  const totalFinal = Math.max(0, subtotal - descontoAplicado);

  document.getElementById("subtotalView").innerText = subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("descontoView").innerText = descontoAplicado.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("totalFinalView").innerText = totalFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ======================================================
// GERAR IMAGEM E SALVAR NO CACHE
// ======================================================

function finalizarEGerarNota() {
  if (itensPedido.length === 0) {
    mostrarMensagem("Adicione ao menos um item para gerar a nota!", "erro");
    return;
  }

  const numPedido = document.getElementById("inputNumPedido").value || "001";
  const idUnico = Date.now();

  // Salva no localStorage
  salvarNoHistorico({
    id: idUnico,
    numPedido: numPedido,
    nomeCliente: document.getElementById("nomeCliente").value,
    lojaCliente: document.getElementById("lojaCliente").value,
    data: new Date().toLocaleDateString("pt-BR"),
    itens: [...itensPedido],
    desconto: descontoAplicado
  });

  gerarEBaixarImagemNota(numPedido);
}

// Converte o HTML da nota em Imagem PNG com tratamento imune a erros locais (file://)
function gerarEBaixarImagemNota(numPedido) {
  const colunasAcao = document.querySelectorAll(".coluna-acao");
  colunasAcao.forEach(el => el.style.display = "none");

  const notaElemento = document.getElementById("nota-preview");

  setTimeout(() => {
    html2canvas(notaElemento, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (element) => {
        // Se a logo falhar no carregamento local, desconsidera ela pra não travar a imagem
        if (element.id === "logoImg" && (element.naturalWidth === 0 || !element.complete)) {
          return true;
        }
        return false;
      }
    }).then(canvas => {
      colunasAcao.forEach(el => el.style.display = "");

      const imagemUrl = canvas.toDataURL("image/png");
      
      const link = document.createElement("a");
      link.download = `Nota_Pedido_${numPedido}_DMArtFerro.png`;
      link.href = imagemUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      mostrarMensagem(`Nota Nº ${numPedido} gerada e salva com sucesso!`);
    }).catch(err => {
      colunasAcao.forEach(el => el.style.display = "");
      mostrarMensagem("Erro ao gerar imagem. Verifique o console.", "erro");
      console.error("Erro no html2canvas:", err);
    });
  }, 200);
}

// Salva o pedido no localStorage
function salvarNoHistorico(pedido) {
  let historico = JSON.parse(localStorage.getItem("historicoNotas_DMArtFerro")) || [];
  
  const indexExistente = historico.findIndex(p => p.id === pedido.id);
  if (indexExistente !== -1) {
    historico[indexExistente] = pedido;
  } else {
    historico.unshift(pedido);
  }

  try {
    localStorage.setItem("historicoNotas_DMArtFerro", JSON.stringify(historico));
    renderizarHistorico();
  } catch (e) {
    mostrarMensagem("Memória do navegador cheia!", "erro");
  }
}

// Renderiza o histórico de pedidos
function renderizarHistorico() {
  const container = document.getElementById("historicoGrid");
  const historico = JSON.parse(localStorage.getItem("historicoNotas_DMArtFerro")) || [];

  if (historico.length === 0) {
    container.innerHTML = "<p style='color: #777;'>Nenhuma nota salva no histórico ainda.</p>";
    return;
  }

  container.innerHTML = "";

  historico.forEach(pedido => {
    const totalPedido = pedido.itens.reduce((acc, i) => acc + i.total, 0) - (pedido.desconto || 0);

    const card = document.createElement("div");
    card.style.cssText = "border: 1px solid #ddd; padding: 12px; border-radius: 8px; background: #f9f9f9; margin-bottom: 10px;";
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong>Pedido Nº: ${pedido.numPedido}</strong>
        <small>${pedido.data}</small>
      </div>
      <p style="margin: 4px 0; font-size: 0.9em;"><strong>Cliente:</strong> ${pedido.nomeCliente || "Não informado"}</p>
      <p style="margin: 4px 0; font-size: 0.9em;"><strong>Total:</strong> R$ ${totalPedido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      
      <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button onclick="carregarPedidoParaEdicao(${pedido.id})" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">✏️ Editar / Reutilizar</button>
        <button onclick="baixarNotaHistorico(${pedido.id})" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">📥 Gerar Imagem</button>
        <button onclick="excluirPedidoHistorico(${pedido.id})" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">🗑️ Excluir</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Carrega pedido do histórico para a tela
function carregarPedidoParaEdicao(id) {
  const historico = JSON.parse(localStorage.getItem("historicoNotas_DMArtFerro")) || [];
  const pedido = historico.find(p => p.id === id);

  if (!pedido) return;

  document.getElementById("inputNumPedido").value = pedido.numPedido;
  document.getElementById("nomeCliente").value = pedido.nomeCliente || "";
  document.getElementById("lojaCliente").value = pedido.lojaCliente || "";
  document.getElementById("descontoInput").value = pedido.desconto || "";

  itensPedido = [...pedido.itens];
  descontoAplicado = pedido.desconto || 0;

  atualizarDadosCliente();
  renderizarTabela();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  mostrarMensagem(`Pedido Nº ${pedido.numPedido} carregado!`);
}

// Dispara geração da imagem do histórico
function baixarNotaHistorico(id) {
  carregarPedidoParaEdicao(id);
  setTimeout(() => {
    const historico = JSON.parse(localStorage.getItem("historicoNotas_DMArtFerro")) || [];
    const pedido = historico.find(p => p.id === id);
    gerarEBaixarImagemNota(pedido.numPedido);
  }, 400);
}

// Exclui pedido
function excluirPedidoHistorico(id) {
  let historico = JSON.parse(localStorage.getItem("historicoNotas_DMArtFerro")) || [];
  historico = historico.filter(p => p.id !== id);
  localStorage.setItem("historicoNotas_DMArtFerro", JSON.stringify(historico));
  
  renderizarHistorico();
  mostrarMensagem("Nota removida.");
}