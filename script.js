let itens = [];
let desconto = 0;

// Configurar Data Atual ao carregar
document.getElementById('dataAtual').innerText = new Date().toLocaleDateString('pt-BR');

function adicionarItem() {
  const codigo = document.getElementById('codigo').value || '-';
  const descricao = document.getElementById('descricao').value;
  const qtd = parseFloat(document.getElementById('qtd').value);
  const valorUnit = parseFloat(document.getElementById('valorUnit').value);

  if (!descricao || isNaN(qtd) || isNaN(valorUnit)) {
    alert('Preencha a descrição, quantidade e valor unitário corretamente!');
    return;
  }

  const valorTotal = qtd * valorUnit;

  itens.push({ codigo, descricao, qtd, valorUnit, valorTotal });
  
  // Limpar campos
  document.getElementById('codigo').value = '';
  document.getElementById('descricao').value = '';
  document.getElementById('qtd').value = '1';
  document.getElementById('valorUnit').value = '';

  renderizarTabela();
}

function aplicarDesconto() {
  const descVal = parseFloat(document.getElementById('descontoInput').value);
  desconto = isNaN(descVal) ? 0 : descVal;
  atualizarTotais();
}

function renderizarTabela() {
  const corpo = document.getElementById('corpoTabela');
  if (!corpo) return;
  
  corpo.innerHTML = '';

  itens.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.descricao}</td>
      <td>${item.qtd}</td>
      <td>R$ ${parseFloat(item.valorUnit).toFixed(2).replace('.', ',')}</td>
      <td>R$ ${parseFloat(item.valorTotal).toFixed(2).replace('.', ',')}</td>
      <td class="ocultar-na-imagem">
        <button class="btn-acao btn-editar" title="Editar item" onclick="editarItem(${index})">✏️</button>
        <button class="btn-acao btn-excluir" title="Remover item" onclick="removerItem(${index})">🗑️</button>
      </td>
    `;
    corpo.appendChild(tr);
  });
}
function atualizarTotais() {
  // Garante a soma convertendo os valores para número de forma segura
  const subtotal = itens.reduce((acc, item) => {
    const valor = parseFloat(item.valorTotal) || 0;
    return acc + valor;
  }, 0);

  const totalFinal = Math.max(0, subtotal - (parseFloat(desconto) || 0));

  // Atualiza os elementos HTML formatados para o padrão brasileiro
  const subtotalEl = document.getElementById('subtotalView');
  const descontoEl = document.getElementById('descontoView');
  const totalFinalEl = document.getElementById('totalFinalView');

  if (subtotalEl) subtotalEl.innerText = subtotal.toFixed(2).replace('.', ',');
  if (descontoEl) descontoEl.innerText = desconto.toFixed(2).replace('.', ',');
  if (totalFinalEl) totalFinalEl.innerText = totalFinal.toFixed(2).replace('.', ',');
}

// Remover Item do Pedido
function removerItem(index) {
  itens.splice(index, 1); // Remove o item do array
  renderizarTabela();     // Atualiza a tabela e os totais
}

// Editar Item (Volta os dados para os inputs para alterar)
function editarItem(index) {
  const item = itens[index];

  // Preenche os campos do formulário com os dados do item selecionado
  document.getElementById('codigo').value = item.codigo === '-' ? '' : item.codigo;
  document.getElementById('descricao').value = item.descricao;
  document.getElementById('qtd').value = item.qtd;
  document.getElementById('valorUnit').value = item.valorUnit;

  // Remove o item da lista antiga para ser re-adicionado ao clicar em "+ Adicionar Item"
  removerItem(index);
}

function finalizarPedido() {
  if (itens.length === 0) {
    alert('Adicione pelo menos um item antes de finalizar!');
    return;
  }

  // Verificar se a biblioteca html2canvas foi carregada corretamente
  if (typeof html2canvas === 'undefined') {
    alert('Erro: A biblioteca de geração de imagem (html2canvas) não foi carregada. Verifique seu index.html.');
    return;
  }

  // 1. Ocultar botões de ação (✏️ 🗑️) temporariamente para não saírem na foto
  document.body.classList.add('gerando-imagem');

  const areaNota = document.getElementById('nota-preview');

// Configuração atualizada para ignorar travamentos por CORS/imagem local
  html2canvas(areaNota, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false
  }).then(canvas => {
    // Restaurar a exibição dos botões na tela
    document.body.classList.remove('gerando-imagem');

    const imgData = canvas.toDataURL('image/png');
    const numPedido = document.getElementById('numPedido').innerText || '001';

    // 3. FAZER DOWNLOAD DA IMAGEM IMEDIATAMENTE
    const link = document.createElement('a');
    link.download = `Pedido_DMArtFerro_${numPedido}.png`;
    link.href = imgData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 4. PREPARAR DADOS E ENVIAR PARA O GOOGLE SHEETS / EMAIL (Opcional se WEB_APP_URL estiver configurado)
    const subtotal = itens.reduce((acc, item) => acc + (parseFloat(item.valorTotal) || 0), 0);
    const totalFinal = Math.max(0, subtotal - (parseFloat(desconto) || 0));
    const dataPedido = document.getElementById('dataAtual').innerText;

    const payload = {
      numPedido: numPedido,
      dataPedido: dataPedido,
      itens: itens,
      desconto: desconto,
      totalFinal: totalFinal,
      imagemBase64: imgData
    };

    // Tentar enviar para a nuvem apenas se a URL do Apps Script estiver preenchida corretamente
    if (typeof WEB_APP_URL !== 'undefined' && WEB_APP_URL.startsWith('http')) {
      fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(() => {
        console.log('Enviado para o Google Sheets/Gmail com sucesso!');
      })
      .catch(err => {
        console.error('Erro ao enviar para a planilha:', err);
      });
    }

    // 5. Sucesso e reset do formulário
    alert(`Pedido #${numPedido} finalizado com sucesso! A imagem foi baixada.`);
    
    itens = [];
    desconto = 0;
    const descInput = document.getElementById('descontoInput');
    if (descInput) descInput.value = '';
    renderizarTabela();
    atualizarNumPedido();

  }).catch(err => {
    document.body.classList.remove('gerando-imagem');
    console.error('Erro ao gerar imagem:', err);
    alert('Ocorreu um erro ao gerar a imagem. Abra o console do navegador (F12) para ver os detalhes.');
  });
}

// Calcula o valor parcial (Qtd x Unitário) enquanto você digita no formulário
function calcularPreviaItem() {
  const qtd = parseFloat(document.getElementById('qtd').value) || 0;
  const valorUnit = parseFloat(document.getElementById('valorUnit').value) || 0;
  const totalItem = qtd * valorUnit;

  document.getElementById('previaTotalItem').innerText = totalItem.toFixed(2);
}

// Atualização da função adicionarItem
function adicionarItem() {
  const codigo = document.getElementById('codigo').value || '-';
  const descricao = document.getElementById('descricao').value;
  const qtd = parseFloat(document.getElementById('qtd').value);
  const valorUnit = parseFloat(document.getElementById('valorUnit').value);

  if (!descricao || isNaN(qtd) || isNaN(valorUnit)) {
    alert('Preencha a descrição, quantidade e valor unitário corretamente!');
    return;
  }

  const valorTotal = qtd * valorUnit;

  // Insere no array de itens do pedido
  itens.push({ codigo, descricao, qtd, valorUnit, valorTotal });
  
  // Limpar campos e prévia
  document.getElementById('codigo').value = '';
  document.getElementById('descricao').value = '';
  document.getElementById('qtd').value = '1';
  document.getElementById('valorUnit').value = '';
  document.getElementById('previaTotalItem').innerText = '0,00';

  // Renderiza a tabela e atualiza a SOMA TOTAL instantaneamente
  renderizarTabela();
  atualizarTotais();
}