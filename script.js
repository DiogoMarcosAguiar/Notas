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

function atualizarPreviewNota() {
  // 1. Atualiza os textos do cliente e pedido na prévia
  document.getElementById('lblNomeCliente').innerText = document.getElementById('nomeCliente').value || 'Cliente não informado';
  document.getElementById('lblNumPedido').innerText = document.getElementById('numPedido').value || '001';

  // 2. Renderiza as linhas de produtos no corpo da tabela da prévia
  const tbody = document.getElementById('corpoTabelaNota');
  tbody.innerHTML = ''; // Limpa antes de renderizar

  let totalGeral = 0;

  itensNotaAtual.forEach((item, index) => {
    const subtotal = item.quantidade * item.precoUnitario;
    totalGeral += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${item.codigo || '-'}</td>
        <td>${item.descricao}</td>
        <td>${item.quantidade}</td>
        <td>R$ ${item.precoUnitario.toFixed(2)}</td>
        <td>R$ ${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });

  // 3. Atualiza o valor total
  document.getElementById('lblTotalNota').innerText = `R$ ${totalGeral.toFixed(2)}`;
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

  // 1. Exibe o QR Code
  if (qrCodeContainer) {
    qrCodeContainer.style.display = 'block';
  }

  // Oculta botões de remoção (lixeira/ações)
  colAcao.forEach(el => el.style.display = 'none');

  // 2. Aguarda o navegador renderizar a tela com o QR Code visível antes de tirar a foto
  setTimeout(() => {
    html2canvas(elNota, {
      scale: 2, // Alta qualidade
      backgroundColor: '#1a1a1a',
      useCORS: true, // Garante que a imagem do QR Code seja renderizada se vier de fonte externa
      scrollY: -window.scrollY, // Evita cortes caso a página esteja rolada
      windowHeight: elNota.scrollHeight // Garante que pegue a altura TOTAL do container
    }).then(canvas => {
      // 3. Restaura a tela escondendo o QR Code novamente
      if (qrCodeContainer) {
        qrCodeContainer.style.display = 'none';
      }
      colAcao.forEach(el => el.style.display = '');

      // 4. Faz o download do PNG
      const num = document.getElementById('numPedido').value || '001';
      const cliente = document.getElementById('nomeCliente').value || 'Cliente';
      const link = document.createElement('a');
      link.download = `Nota_DMArtFerro_Ped_${num}_${cliente}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // 5. Salva no histórico e lança no Financeiro
      if (typeof salvarEIntegrarNota === 'function') {
        salvarEIntegrarNota();
      }
    }).catch(err => {
      console.error('Erro ao gerar a notinha:', err);
      // Garante a restauração visual mesmo em caso de erro
      if (qrCodeContainer) qrCodeContainer.style.display = 'none';
      colAcao.forEach(el => el.style.display = '');
    });
  }, 100); // 100 milissegundos é o tempo ideal para o navegador pintar o QR Code
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

// Garante o carregamento do histórico assim que abrir a página
document.addEventListener('DOMContentLoaded', () => {
  carregarHistoricoNotas();
});

// Carrega todas as notas salvas do localStorage
function carregarHistoricoNotas() {
  const notasSalvas = JSON.parse(localStorage.getItem('historicoNotasDMArtFerro')) || [];
  renderizarTabelaHistorico(notasSalvas);
}

// Renderiza a lista de notas na tabela
function renderizarTabelaHistorico(lista) {
  const tbody = document.getElementById('corpoTabelaHistoricoNotas');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Nenhuma nota encontrada.</td></tr>';
    return;
  }

  // Ordena pelas notas mais recentes primeiro
  lista.reverse().forEach((nota, index) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>#${nota.numPedido || '-'}</strong></td>
        <td>${nota.data || '-'}</td>
        <td>${nota.cliente || 'Cliente não informado'}</td>
        <td style="color: #4caf50; font-weight: bold;">R$ ${parseFloat(nota.total || 0).toFixed(2)}</td>
        <td>
          <button onclick="visualizarNotaSalva('${nota.id || index}')" style="background: #d4af37; color: #000; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-weight: bold;">👁️ Ver</button>
          <button onclick="excluirNotaSalva('${nota.id || index}')" style="background: #ff4444; color: #fff; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer;">🗑️</button>
        </td>
      </tr>
    `;
  });
}

// Filtra as notas pelo campo de busca
function filtrarNotasHistorico() {
  const termo = document.getElementById('txtBuscaNota').value.toLowerCase();
  const notasSalvas = JSON.parse(localStorage.getItem('historicoNotasDMArtFerro')) || [];

  const filtradas = notasSalvas.filter(nota => {
    const cliente = (nota.cliente || '').toLowerCase();
    const ped = (nota.numPedido || '').toString().toLowerCase();
    return cliente.includes(termo) || ped.includes(termo);
  });

  renderizarTabelaHistorico(filtradas);
}

// Exibe os detalhes da nota no Modal
function visualizarNotaSalva(idOuIndex) {
  const notasSalvas = JSON.parse(localStorage.getItem('historicoNotasDMArtFerro')) || [];
  const nota = notasSalvas.find((n, idx) => n.id === idOuIndex || idx == idOuIndex);

  if (!nota) {
    alert('Nota não encontrada!');
    return;
  }

  let htmlItens = '';
  if (nota.itens && nota.itens.length > 0) {
    nota.itens.forEach(item => {
      const totalItem = (item.quantidade * item.precoUnitario) || item.subtotal || 0;
      htmlItens += `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 6px;">${item.codigo || '-'}</td>
          <td style="padding: 6px;">${item.descricao}</td>
          <td style="padding: 6px; text-align: center;">${item.quantidade}</td>
          <td style="padding: 6px; text-align: right;">R$ ${parseFloat(item.precoUnitario).toFixed(2)}</td>
          <td style="padding: 6px; text-align: right;">R$ ${parseFloat(totalItem).toFixed(2)}</td>
        </tr>
      `;
    });
  }

  const htmlModal = `
    <div style="background: #111; padding: 15px; border-radius: 6px;">
      <p style="margin: 0 0 5px 0;"><strong>Pedido:</strong> #${nota.numPedido}</p>
      <p style="margin: 0 0 5px 0;"><strong>Cliente:</strong> ${nota.cliente}</p>
      <p style="margin: 0 0 15px 0;"><strong>Data:</strong> ${nota.data}</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 15px;">
        <thead>
          <tr style="border-bottom: 1px solid #555; color: #d4af37;">
            <th style="text-align: left;">Cód</th>
            <th style="text-align: left;">Item</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Unit</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${htmlItens}
        </tbody>
      </table>

      <h3 style="text-align: right; color: #4caf50; margin: 0;">Total: R$ ${parseFloat(nota.total).toFixed(2)}</h3>
    </div>
  `;

  document.getElementById('conteudoModalNota').innerHTML = htmlModal;
  document.getElementById('modalDetalheNota').style.display = 'flex';
}

function fecharModalNota() {
  document.getElementById('modalDetalheNota').style.display = 'none';
}

// Exclui uma nota do histórico
function excluirNotaSalva(idOuIndex) {
  if (!confirm('Deseja realmente excluir esta nota do histórico?')) return;

  let notasSalvas = JSON.parse(localStorage.getItem('historicoNotasDMArtFerro')) || [];
  notasSalvas = notasSalvas.filter((n, idx) => n.id !== idOuIndex && idx != idOuIndex);

  localStorage.setItem('historicoNotasDMArtFerro', JSON.stringify(notasSalvas));
  carregarHistoricoNotas();
}

function salvarEIntegrarNota() {
  const numPedido = document.getElementById('numPedido').value || '001';
  const cliente = document.getElementById('nomeCliente').value || 'Cliente não informado';
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  
  let totalNota = 0;
  itensNotaAtual.forEach(item => {
    totalNota += item.quantidade * item.precoUnitario;
  });

  const novaNota = {
    id: 'nota_' + Date.now(),
    numPedido: numPedido,
    cliente: cliente,
    data: dataHoje,
    itens: [...itensNotaAtual],
    total: totalNota
  };

  const historico = JSON.parse(localStorage.getItem('historicoNotasDMArtFerro')) || [];
  historico.push(novaNota);
  localStorage.setItem('historicoNotasDMArtFerro', JSON.stringify(historico));

  // Atualiza a tabela de consulta na tela na hora
  carregarHistoricoNotas();
}