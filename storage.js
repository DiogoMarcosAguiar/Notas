/* ======================================================
   GERENCIADOR DE ARMAZENAMENTO - DMArtFerro
   ====================================================== */

// Chaves do localStorage
const KEYS = {
  NOTAS: 'dmartferro_notas',
  FINANCEIRO: 'dmartferro_financeiro'
};

// --- FUNÇÕES DE LEITURA E ESCRITA ---

// Busca todas as notas salvas
function obterNotasSalvas() {
  const dados = localStorage.getItem(KEYS.NOTAS);
  return dados ? JSON.parse(dados) : [];
}

// Salva uma nova nota ou atualiza a lista de notas
function salvarNota(novaNota) {
  const notas = obterNotasSalvas();
  notas.push(novaNota);
  localStorage.setItem(KEYS.NOTAS, JSON.stringify(notas));
  return notas;
}

// Busca todos os lançamentos financeiros
function obterFinanceiroSalvo() {
  const dados = localStorage.getItem(KEYS.FINANCEIRO);
  return dados ? JSON.parse(dados) : [];
}

// Salva um novo lançamento no financeiro
function salvarLancamentoFinanceiro(lancamento) {
  const historico = obterFinanceiroSalvo();
  historico.push(lancamento);
  localStorage.setItem(KEYS.FINANCEIRO, JSON.stringify(historico));
  return historico;
}

// --- FUNÇÕES DE BACKUP E RESTAURAÇÃO ---

// Baixa um arquivo com TODOS os dados do sistema
function exportarBackup() {
  const dadosTotais = {
    notas: obterNotasSalvas(),
    financeiro: obterFinanceiroSalvo(),
    dataBackup: new Date().toLocaleString('pt-BR')
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosTotais, null, 2));
  const downloadAnchor = document.createElement('a');
  
  const dataHoje = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup_DMArtFerro_${dataHoje}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Importa um arquivo JSON de backup
function importarBackup(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const conteudo = JSON.parse(e.target.result);
      if (conteudo.notas) {
        localStorage.setItem(KEYS.NOTAS, JSON.stringify(conteudo.notas));
      }
      if (conteudo.financeiro) {
        localStorage.setItem(KEYS.FINANCEIRO, JSON.stringify(conteudo.financeiro));
      }
      alert('✅ Backup restaurado com sucesso! A página será recarregada.');
      window.location.reload();
    } catch (err) {
      alert('❌ Erro ao ler o arquivo de backup. Verifique se o arquivo JSON é válido.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}