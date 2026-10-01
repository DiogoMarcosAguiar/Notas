// ==========================================
// MÓDULO: GERENCIAMENTO DE ITENS E PREVIEW
// ==========================================

// Array global acessível em todos os scripts
window.itensNota = [];

function atualizarPreviewNota() {
  const inputCliente = document.getElementById('clienteNome') || document.getElementById('cliente');
  const viewCliente = document.getElementById('viewNomeCliente') || document.getElementById('viewCliente');
  if (inputCliente && viewCliente) {
    viewCliente.innerText = inputCliente.value.trim() || "--";
  }

  const inputContato = document.getElementById('clienteContato') || document.getElementById('contatoCliente');
  const viewContato = document.getElementById('viewContatoCliente') || document.getElementById('viewContato');
  if (inputContato && viewContato) {
    viewContato.innerText = inputContato.value.trim() || "--";
  }

  const inputData = document.getElementById('dataEmissao') || document.getElementById('dataNota');
  const viewData = document.getElementById('viewDataPedido') || document.getElementById('viewData');
  if (viewData) {
    if (inputData && inputData.value) {
      const p = inputData.value.split('-');
      viewData.innerText = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : inputData.value;
    } else {
      viewData.innerText = new Date().toLocaleDateString('pt-BR');
    }
  }
}

function adicionarItem(event) {
  if (event) event.preventDefault();

  const elCodigo = document.getElementById('codigoItem');
  const elDescricao = document.getElementById('descricaoItem');
  const elQtd = document.getElementById('qtdItem');
  const elValor = document.getElementById('valorUnitItem');

  if (!elCodigo || !elDescricao || !elQtd || !elValor) {
    alert("Erro: Campos de item não encontrados.");
    return;
  }

  const codigo = elCodigo.value.trim();
  const descricao = elDescricao.value.trim();
  const quantidade = parseInt(elQtd.value, 10) || 1;
  const valorUnitario = parseFloat(elValor.value.replace(',', '.')) || 0;

  if (!codigo || !descricao || valorUnitario <= 0) {
    alert("Preencha código, descrição e valor válidos!");
    return;
  }

  const totalItem = quantidade * valorUnitario;

  window.itensNota.push({ codigo, descricao, quantidade, valorUnitario, totalItem });

  renderizarTabelaItens();
  atualizarPreviewNota();

  elCodigo.value = '';
  elDescricao.value = '';
  elQtd.value = '1';
  elValor.value = '';
}

function renderizarTabelaItens() {
  const corpoTabela = document.getElementById('corpoTabelaNota');
  if (!corpoTabela) return;

  corpoTabela.innerHTML = '';
  let valorTotalNota = 0;

  window.itensNota.forEach((item, index) => {
    valorTotalNota += item.totalItem;

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #333';
    tr.innerHTML = `
      <td style="padding: 6px;">${item.codigo}</td>
      <td style="padding: 6px;">${item.descricao}</td>
      <td style="padding: 6px; text-align: center;">${item.quantidade}</td>
      <td style="padding: 6px;">R$ ${item.valorUnitario.toFixed(2).replace('.', ',')}</td>
      <td style="padding: 6px;">R$ ${item.totalItem.toFixed(2).replace('.', ',')}</td>
      <td class="coluna-acao" style="padding: 6px; text-align: center;">
        <button type="button" onclick="removerItem(${index})" style="background: transparent; color: #ff4d4d; border: none; cursor: pointer; font-size: 14px;">❌</button>
      </td>
    `;
    corpoTabela.appendChild(tr);
  });

  const viewTotal = document.getElementById('viewValorTotal');
  if (viewTotal) {
    viewTotal.innerText = `R$ ${valorTotalNota.toFixed(2).replace('.', ',')}`;
  }
}

function removerItem(index) {
  window.itensNota.splice(index, 1);
  renderizarTabelaItens();
}

// Eventos de escuta ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const inputData = document.getElementById('dataEmissao') || document.getElementById('dataNota');
  if (inputData) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    inputData.value = `${ano}-${mes}-${dia}`;
  }

  ['clienteNome', 'cliente', 'clienteContato', 'contatoCliente', 'dataEmissao', 'dataNota'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', atualizarPreviewNota);
      el.addEventListener('change', atualizarPreviewNota);
    }
  });

  atualizarPreviewNota();
});