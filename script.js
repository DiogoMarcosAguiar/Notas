// ==========================================
// VARIÁVEIS GLOBAIS DA APLICAÇÃO
// ==========================================
let itensNota = [];

// Função auxiliar para dar tempo do DOM renderizar totalmente
const esperarRenderizacao = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// ATUALIZAR PREVIEW DA NOTA (CLIENTE, CONTATO, DATA)
// ==========================================
function atualizarPreviewNota() {
  // 1. Atualiza Nome do Cliente
  const inputCliente = document.getElementById('clienteNome') 
                    || document.getElementById('cliente') 
                    || document.getElementById('nomeCliente');
  const viewCliente = document.getElementById('viewNomeCliente') 
                   || document.getElementById('viewCliente');

  if (inputCliente && viewCliente) {
    viewCliente.innerText = inputCliente.value.trim() || "--";
  }

  // 2. Atualiza Contato do Cliente
  const inputContato = document.getElementById('clienteContato') 
                    || document.getElementById('contatoCliente') 
                    || document.getElementById('contato');
  const viewContato = document.getElementById('viewContatoCliente') 
                   || document.getElementById('viewContato');

  if (inputContato && viewContato) {
    viewContato.innerText = inputContato.value.trim() || "--";
  }

  // 3. Atualiza Data do Pedido
  const inputData = document.getElementById('dataEmissao') || document.getElementById('dataNota');
  const viewData = document.getElementById('viewDataPedido') || document.getElementById('viewData');

  if (viewData) {
    if (inputData && inputData.value) {
      const partes = inputData.value.split('-');
      if (partes.length === 3) {
        viewData.innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
      } else {
        viewData.innerText = inputData.value;
      }
    } else {
      viewData.innerText = new Date().toLocaleDateString('pt-BR');
    }
  }
}

// ==========================================
// ADICIONAR E RENDERIZAR ITENS
// ==========================================
function adicionarItem(event) {
  if (event) event.preventDefault();

  const elCodigo = document.getElementById('codigoItem');
  const elDescricao = document.getElementById('descricaoItem');
  const elQtd = document.getElementById('qtdItem');
  const elValor = document.getElementById('valorUnitItem');

  if (!elCodigo || !elDescricao || !elQtd || !elValor) {
    alert("Erro: Não foi possível localizar os campos de entrada do item no HTML.");
    return;
  }

  const codigo = elCodigo.value.trim();
  const descricao = elDescricao.value.trim();
  const quantidade = parseInt(elQtd.value, 10) || 1;
  const valorUnitario = parseFloat(elValor.value.replace(',', '.')) || 0;

  if (!codigo || !descricao || valorUnitario <= 0) {
    alert("Preencha o Código, a Descrição e um Valor Unitário maior que zero!");
    return;
  }

  const totalItem = quantidade * valorUnitario;

  // Adiciona item ao array global

  itensNota.push({
    codigo,
    descricao,
    quantidade,
    valorUnitario,
    totalItem
  });

  // Atualiza a tabela na prévia
  renderizarTabelaItens();

  // ATUALIZA CLIENTE/CONTATO NA PRÉVIA
  atualizarPreviewNota();

  // Limpa os campos do formulário de itens
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

  itensNota.forEach((item, index) => {
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
  itensNota.splice(index, 1);
  renderizarTabelaItens();
}

// Configuração inicial ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const inputData = document.getElementById('dataEmissao') || document.getElementById('dataNota');
  if (inputData) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    inputData.value = `${ano}-${mes}-${dia}`;
  }
  atualizarPreviewNota();
});


document.addEventListener('DOMContentLoaded', () => {
  // Sincroniza campos de entrada com a prévia
  const inputsParaSincronizar = ['clienteNome', 'cliente', 'nomeCliente', 'clienteContato', 'contatoCliente', 'contato', 'dataEmissao', 'dataNota'];

  inputsParaSincronizar.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', atualizarPreviewNota);
      el.addEventListener('change', atualizarPreviewNota);
    }
  });

  // Atualização inicial
  atualizarPreviewNota();
});