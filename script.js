/* ======================================================
   GERADOR DE NOTAS & INTEGRAÇÃO COM FINANCEIRO - DMArtFerro
   ====================================================== */

// Array temporário dos itens da nota atual
let itensNotaAtual = [];

// 1. Adicionar Item à Tabela da Nota
function adicionarItem(event) {
  event.preventDefault();

  const codigo = document.getElementById('codigoItem').value.trim();
  const descricao = document.getElementById('descricaoItem').value.trim();
  const qtd = parseInt(document.getElementById('qtdItem').value) || 1;
  const valorUnit = parseFloat(document.getElementById('valorUnitItem').value) || 0;

  if (!codigo || !descricao || valorUnit <= 0) {
    alert('Por favor, preencha o código, descrição e valor unitário corretamente.');
    return;
  }

  const subtotal = qtd * valorUnit;

  // Adiciona ao array local
  itensNotaAtual.push({
    codigo,
    descricao,
    qtd,
    valorUnit,
    subtotal
  });

  // Limpa os campos do formulário de item
  document.getElementById('codigoItem').value = '';
  document.getElementById('descricaoItem').value = '';
  document.getElementById('qtdItem').value = '1';
  document.getElementById('valorUnitItem').value = '';

  // Atualiza a tabela da nota na tela
  renderizarTabelaNota();
}

// 2. Renderizar Tabela e Calcular Totais
function renderizarTabelaNota() {
  const corpoTabela = document.getElementById('corpoTabela');
  corpoTabela.innerHTML = '';

  let valorTotal = 0;
  let totalQtd = 0;

  itensNotaAtual.forEach((item, index) => {
    valorTotal += item.subtotal;
    totalQtd += item.qtd;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.codigo}</strong></td>
      <td>${item.descricao}</td>
      <td>${item.qtd}</td>
      <td>R$ ${item.valorUnit.toFixed(2).replace('.', ',')}</td>
      <td>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
      <td class="coluna-acao">
        <button type="button" onclick="removerItemNota(${index})" style="background:none; border:none; color:#f44336; cursor:pointer;" title="Remover Item">🗑️</button>
      </td>
    `;
    corpoTabela.appendChild(tr);
  });

  // Atualiza os totais na tela
  document.getElementById('totalQtdItens').innerText = totalQtd;
  document.getElementById('valorTotalNota').innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
}

// 3. Remover Item da Nota
function removerItemNota(index) {
  itensNotaAtual.splice(index, 1);
  renderizarTabelaNota();
}

// 4. Sincronizar Informações do Cliente com a Prévia da Nota em Tempo Real
document.addEventListener('DOMContentLoaded', () => {
  const numPedido = document.getElementById('numPedido');
  const nomeCliente = document.getElementById('nomeCliente');
  const contatoCliente = document.getElementById('contatoCliente');
  const dataPedido = document.getElementById('dataPedido');

  // Define data atual padrão no input
  if (dataPedido) {
    const hoje = new Date().toISOString().split('T')[0];
    dataPedido.value = hoje;
    document.getElementById('viewDataPedido').innerText = new Date().toLocaleDateString('pt-BR');
  }

  // Listeners para atualizar na hora que digita
  if (numPedido) numPedido.addEventListener('input', (e) => document.getElementById('viewNumPedido').innerText = e.target.value || '001');
  if (nomeCliente) nomeCliente.addEventListener('input', (e) => document.getElementById('viewNomeCliente').innerText = e.target.value || '--');
  if (contatoCliente) contatoCliente.addEventListener('input', (e) => document.getElementById('viewContatoCliente').innerText = e.target.value || '--');
  if (dataPedido) dataPedido.addEventListener('change', (e) => {
    if (e.target.value) {
      const [ano, mes, dia] = e.target.value.split('-');
      document.getElementById('viewDataPedido').innerText = `${dia}/${mes}/${ano}`;
    }
  });

  // Carrega o histórico de notas salvas se existir a seção
  carregarHistoricoNotas();
});

// 5. Finalizar Venda / Salvar Nota e Baixar Imagem


function gerarEBaixarImagemNota() {
  if (itensNotaAtual.length === 0) {
    alert('Adicione pelo menos um item à nota antes de baixar ou salvar!');
    return;
  }

  const elNota = document.getElementById('nota-preview');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const colAcao = document.querySelectorAll('.coluna-acao');

  // 1. Torna o QR Code visível APENAS para gerar a imagem
  if (qrCodeContainer) {
    qrCodeContainer.style.display = 'block';
  }

  // Oculta temporariamente os botões de lixeira/remoção
  colAcao.forEach(el => el.style.display = 'none');

  // 2. Tira a foto da nota
  html2canvas(elNota, {
    scale: 2, // Resolução em alta definição
    backgroundColor: '#1a1a1a'
  }).then(canvas => {
    // 3. Restaura o estado da tela (esconde o QR Code e reexibe os botões)
    if (qrCodeContainer) {
      qrCodeContainer.style.display = 'none';
    }
    colAcao.forEach(el => el.style.display = '');

    // 4. Faz o download da imagem da nota gerada com o QR Code
    const num = document.getElementById('numPedido').value || '001';
    const cliente = document.getElementById('nomeCliente').value || 'Cliente';
    const link = document.createElement('a');
    link.download = `Nota_DMArtFerro_Ped_${num}_${cliente}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    // 5. Salva no histórico e lança no Financeiro
    salvarEIntegrarNota();
  });
}

// 6. Integração Automática com o Storage e Financeiro
function salvarEIntegrarNota() {
  const numPedido = document.getElementById('numPedido').value || '001';
  const nomeCliente = document.getElementById('nomeCliente').value || 'Cliente Não Informado';
  const data = document.getElementById('dataPedido').value || new Date().toISOString().split('T')[0];
  
  let valorTotal = 0;
  itensNotaAtual.forEach(i => valorTotal += i.subtotal);

  const dadosNota = {
    id: Date.now(),
    numPedido,
    nomeCliente,
    data,
    itens: itensNotaAtual,
    valorTotal,
    status: 'Paga'
  };

  // 1. Salva a Nota no LocalStorage de Notas
  salvarNota(dadosNota);

  // 2. Lança automaticamente a Entrada no Financeiro
  const lancamentoFinanceiro = {
    id: Date.now(),
    data: data.split('-').reverse().join('/'),
    descricao: `Venda Nota Pedido #${numPedido} - ${nomeCliente}`,
    tipo: 'Entrada',
    valor: valorTotal
  };
  salvarLancamentoFinanceiro(lancamentoFinanceiro);

  alert(`✅ Nota #${numPedido} salva no histórico e lançamento de R$ ${valorTotal.toFixed(2)} registrado no Financeiro com sucesso!`);

  // Recarrega o histórico na tela
  carregarHistoricoNotas();
}

// 7. Exibir Histórico de Notas Emitidas na Tela
function carregarHistoricoNotas() {
  const corpoHistorico = document.getElementById('corpoHistoricoNotas');
  if (!corpoHistorico) return;

  const notas = obterNotasSalvas(); // Função do storage.js
  corpoHistorico.innerHTML = '';

  if (notas.length === 0) {
    corpoHistorico.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#777;">Nenhuma nota emitida ainda.</td></tr>`;
    return;
  }

  notas.forEach((nota) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${nota.numPedido}</strong></td>
      <td>${nota.data.split('-').reverse().join('/')}</td>
      <td>${nota.nomeCliente}</td>
      <td>${nota.itens.length} item(ns)</td>
      <td style="color:#4caf50; font-weight:bold;">R$ ${nota.valorTotal.toFixed(2).replace('.', ',')}</td>
      <td>
        <span class="tag-startup" style="font-size:0.65rem; background:rgba(76, 175, 80, 0.2); border-color:#4caf50; color:#4caf50;">CONCLUÍDA</span>
      </td>
    `;
    corpoHistorico.appendChild(tr);
  });
}

// Controls para o Menu Hambúrguer Sidebar
function toggleMenu() {
  const sidebar = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('menuOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}