// CONFIGURAÇÃO DO SUPABASE
// Substitua com os seus dados reais entre as aspas:
const SUPABASE_URL = "https://hhlfilsjtkmvhuaivezc.supabase.co";
const SUPABASE_KEY = "sb_publishable_fckaKNrimsB5t8bz1p1WPA_oIU-F48r";

// Conexão com o Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let lancamentos = [];

// Salva um novo lançamento no Supabase
async function salvarLancamento(event) {
  event.preventDefault();

  const tipo = document.getElementById('tipo').value;
  const descricao = document.getElementById('descricao').value.trim();
  const valor = parseFloat(document.getElementById('valor').value) || 0;
  const categoria = document.getElementById('categoria').value;
  const data = document.getElementById('dataLancamento').value;

  const item = {
    id: Date.now(),
    tipo,
    descricao,
    valor,
    categoria,
    data_lancamento: data, // Enviando com o nome exato da coluna do banco
    data // Mantendo caso o banco também tenha a coluna data
  };

  // Envia para a nuvem
  const { error } = await supabaseClient.from('financeiro').insert([item]);

  if (error) {
    console.error('Erro ao salvar no Supabase:', error);
    alert('Erro ao salvar na nuvem: ' + error.message);
    return;
  }

  // Limpa formulário e atualiza dados
  document.getElementById('formLancamento').reset();
  definirDataHoje();
  carregarDadosNuvem();
}

// Carrega todas as movimentações direto do Supabase
async function carregarDadosNuvem() {
  const corpoTabela = document.getElementById('tabelaHistorico');
  if (corpoTabela) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #d4af37; padding: 15px;">Sincronizando com a nuvem... 🔄</td>
      </tr>
    `;
  }

  const { data, error } = await supabaseClient
    .from('financeiro')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Erro ao buscar dados:', error);
    if (corpoTabela) {
      corpoTabela.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #dc3545; padding: 15px;">Erro ao carregar dados da nuvem.</td>
        </tr>
      `;
    }
    return;
  }

  lancamentos = data || [];
  renderizarPainel();
}

// Renderiza Tabela e Dashboard de Cards
function renderizarPainel() {
  const corpoTabela = document.getElementById('tabelaHistorico');
  if (!corpoTabela) return;

  corpoTabela.innerHTML = '';

  let faturamento = 0;
  let despesas = 0;

  if (lancamentos.length === 0) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #888; padding: 15px;">Nenhuma movimentação registrada na nuvem.</td>
      </tr>
    `;
  } else {
    lancamentos.forEach(item => {
      if (item.tipo === 'ENTRADA') {
        faturamento += parseFloat(item.valor) || 0;
      } else {
        despesas += parseFloat(item.valor) || 0;
      }

      const dataRaw = item.data_lancamento || item.data || '';
      let dataFormatada = 'N/A';
      if (dataRaw) {
        const partesData = dataRaw.split('T')[0].split('-');
        if (partesData.length === 3) {
          dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
        }
      }

      const eEntrada = item.tipo === 'ENTRADA';
      const corTexto = eEntrada ? '#28a745' : '#dc3545';
      const sinal = eEntrada ? '+' : '-';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #333';
      tr.innerHTML = `
        <td style="padding: 10px 6px;">${dataFormatada}</td>
        <td style="padding: 10px 6px; color: ${corTexto}; font-weight: bold;">${item.tipo}</td>
        <td style="padding: 10px 6px;">${item.descricao}</td>
        <td style="padding: 10px 6px; color: #ccc;">${item.categoria}</td>
        <td style="padding: 10px 6px; color: ${corTexto}; font-weight: bold;">${sinal} R$ ${(parseFloat(item.valor) || 0).toFixed(2)}</td>
        <td style="padding: 10px 6px; text-align: center;">
          <button onclick="excluirLancamento(${item.id})" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Excluir">🗑️</button>
        </td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  // Atualiza Totais nos Cards
  const lucro = faturamento - despesas;

  const elEntradas = document.getElementById('totalEntradas');
  const elSaidas = document.getElementById('totalSaidas');
  const elLucro = document.getElementById('totalLucro');

  if (elEntradas) elEntradas.innerText = `R$ ${faturamento.toFixed(2)}`;
  if (elSaidas) elSaidas.innerText = `R$ ${despesas.toFixed(2)}`;
  if (elLucro) {
    elLucro.innerText = `R$ ${lucro.toFixed(2)}`;
    elLucro.style.color = lucro >= 0 ? '#d4af37' : '#dc3545';
  }
}

// Exclui registro no Supabase
async function excluirLancamento(id) {
  if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
    const { error } = await supabaseClient.from('financeiro').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarDadosNuvem();
    }
  }
}

// Preenche data atual por padrão
function definirDataHoje() {
  const inputData = document.getElementById('dataLancamento');
  if (inputData && !inputData.value) {
    inputData.value = new Date().toISOString().split('T')[0];
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  definirDataHoje();
  carregarDadosNuvem();
});

// EXPORTAR BACKUP (.JSON)
function baixarBackup() {
  if (lancamentos.length === 0) {
    alert("Não há lançamentos para exportar!");
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lancamentos, null, 2));
  const downloadAnchor = document.createElement('a');
  const dataHoje = new Date().toISOString().split('T')[0];
  
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup_financeiro_dmartferro_${dataHoje}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// RESTAURAR BACKUP (.JSON) PARA O SUPABASE
async function restaurarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const dadosImportados = JSON.parse(e.target.result);

      if (!Array.isArray(dadosImportados)) {
        alert("O arquivo selecionado é inválido.");
        return;
      }

      if (confirm(`Deseja importar ${dadosImportados.length} lançamentos para a nuvem?`)) {
        // Formata os objetos para garantir compatibilidade com o Supabase
        const itensParaInserir = dadosImportados.map(item => ({
          id: item.id || Date.now() + Math.floor(Math.random() * 1000),
          tipo: item.tipo,
          descricao: item.descricao,
          valor: parseFloat(item.valor) || 0,
          categoria: item.categoria,
          data_lancamento: item.data_lancamento || item.data || new Date().toISOString().split('T')[0],
          data: item.data || item.data_lancamento || new Date().toISOString().split('T')[0]
        }));

        const { error } = await supabaseClient.from('financeiro').insert(itensParaInserir);

        if (error) {
          console.error("Erro ao restaurar backup:", error);
          alert("Erro ao enviar backup para o banco: " + error.message);
        } else {
          alert("Backup restaurado e sincronizado com a nuvem com sucesso!");
          carregarDadosNuvem();
        }
      }
    } catch (err) {
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}