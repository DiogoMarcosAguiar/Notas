// Array global para armazenar os itens do pedido atual
let itensPedido = [];

// Função para atualizar os dados do cliente na prévia em tempo real
function atualizarPreviewNota() {
  const numPedido = document.getElementById('numPedido').value || '001';
  const nomeCliente = document.getElementById('nomeCliente').value || '--';
  const contatoCliente = document.getElementById('contatoCliente').value || '--';
  const dataPedido = document.getElementById('dataPedido').value;

  document.getElementById('viewNumPedido').innerText = numPedido;
  document.getElementById('viewNomeCliente').innerText = nomeCliente;
  document.getElementById('viewContatoCliente').innerText = contatoCliente;

  if (dataPedido) {
    const partes = dataPedido.split('-');
    document.getElementById('viewDataPedido').innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
  } else {
    document.getElementById('viewDataPedido').innerText = '--/--/----';
  }
}

// Função acionada ao enviar o formulário de adicionar item
function adicionarItem(event) {
  event.preventDefault();

  const codigo = document.getElementById('codigoItem').value.trim();
  const descricao = document.getElementById('descricaoItem').value.trim();
  const qtd = parseInt(document.getElementById('qtdItem').value) || 1;
  const valorUnit = parseFloat(document.getElementById('valorUnitItem').value) || 0;
  const total = qtd * valorUnit;

  // Adiciona ao array
  itensPedido.push({
    id: Date.now(), // ID único para controle
    codigo,
    descricao,
    qtd,
    valorUnit,
    total
  });

  // Limpa o formulário de itens
  document.getElementById('formAdicionarItem').reset();
  document.getElementById('qtdItem').value = 1;

  // Atualiza a visualização da tabela
  renderizarTabela();
}

// Função para renderizar a tabela na prévia com botões de Ação
function renderizarTabela() {
  const corpoTabela = document.getElementById('corpoTabelaNota');
  corpoTabela.innerHTML = '';

  let totalGeral = 0;
  let totalQtd = 0;

  if (itensPedido.length === 0) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #888; padding: 10px;">Nenhum item adicionado ainda.</td>
      </tr>
    `;
  } else {
    itensPedido.forEach((item, index) => {
      totalGeral += item.total;
      totalQtd += item.qtd;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #333';
      tr.innerHTML = `
        <td style="padding: 8px 4px;">${item.codigo}</td>
        <td style="padding: 8px 4px;">${item.descricao}</td>
        <td style="padding: 8px 4px; text-align: center;">${item.qtd}</td>
        <td style="padding: 8px 4px;">R$ ${item.valorUnit.toFixed(2)}</td>
        <td style="padding: 8px 4px;">R$ ${item.total.toFixed(2)}</td>
        <td class="coluna-acao" style="padding: 8px 4px; text-align: center;">
          <button onclick="editarItem(${item.id})" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Editar">✏️</button>
          <button onclick="removerItem(${item.id})" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Remover">🗑️</button>
        </td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  // Atualiza os totais na notinha
  document.getElementById('totalQtdItens').innerText = totalQtd;
  document.getElementById('lblTotalNota').innerText = `R$ ${totalGeral.toFixed(2)}`;
}

// Função para remover item
function removerItem(id) {
  itensPedido = itensPedido.filter(item => item.id !== id);
  renderizarTabela();
}

// Função para editar item (recarrega os dados no form para alteração)
function editarItem(id) {
  const item = itensPedido.find(i => i.id === id);
  if (item) {
    document.getElementById('codigoItem').value = item.codigo;
    document.getElementById('descricaoItem').value = item.descricao;
    document.getElementById('qtdItem').value = item.qtd;
    document.getElementById('valorUnitItem').value = item.valorUnit;

    // Remove o item atual para re-adicionar editado
    removerItem(id);
  }
}

// Função para capturar a notinha como Imagem (escondendo os botões de ação)
function gerarEBaixarImagemNota() {
  const elementoNota = document.getElementById('nota-preview');
  const colunasAcao = document.querySelectorAll('.coluna-acao');

  // Esconde temporariamente a coluna de ações para não sair no print
  colunasAcao.forEach(col => col.style.display = 'none');

  html2canvas(elementoNota, {
    backgroundColor: '#1a1a1a',
    scale: 2, // Melhora a resolução da imagem baixada
    useCORS: true, // Permite carregar imagens do QR Code / Logo sem bloquear
    allowTaint: true, // Permite captura de imagens do mesmo diretório
    logging: false
  }).then(canvas => {
    // Restaura a visibilidade dos botões de ação
    colunasAcao.forEach(col => col.style.display = '');

    const link = document.createElement('a');
    const numPedido = document.getElementById('numPedido').value || '001';
    const nomeCliente = document.getElementById('nomeCliente').value || 'Cliente';
    
    link.download = `Nota_DMArtFerro_Pedido_${numPedido}_${nomeCliente}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    colunasAcao.forEach(col => col.style.display = '');
    console.error('Erro ao gerar imagem da nota:', err);
    alert('Ocorreu um erro ao gerar a imagem da notinha.');
  });
}

// Menu Hambúrguer
function toggleMenu() {
  const menu = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('menuOverlay');
  menu.classList.toggle('open');
  overlay.classList.toggle('open');
}

// Inicializa a tabela e define a data de hoje como padrão
document.addEventListener('DOMContentLoaded', () => {
  const inputData = document.getElementById('dataPedido');
  if (inputData) {
    const hoje = new Date().toISOString().split('T')[0];
    inputData.value = hoje;
  }
  atualizarPreviewNota();
  renderizarTabela();
});