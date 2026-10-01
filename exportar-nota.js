// ==========================================
// MÓDULO: EXPORTAÇÃO (PNG & PDF)
// ==========================================

async function baixarNotaPNG() {
  const container = document.getElementById('containerNota');
  if (!container) {
    alert("Erro: Recipiente 'containerNota' não encontrado.");
    return;
  }

  // 1. Seleciona o título da coluna de Ação (th) e todas as células com os botões X (td)
  const elementosAcao = container.querySelectorAll('th:nth-child(6), td:nth-child(6), .coluna-acao, .btn-remover');

  // 2. Oculta temporariamente a coluna inteira de ações
  elementosAcao.forEach(el => el.style.display = 'none');

  try {
    if (typeof atualizarPreviewNota === 'function') atualizarPreviewNota();
    await new Promise(r => setTimeout(r, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#111111',
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const elCliente = document.getElementById('clienteNome') || document.getElementById('cliente');
    const nomeCliente = elCliente?.value?.trim() || 'Cliente';

    const link = document.createElement('a');
    link.download = `Nota_DMArtFerro_${nomeCliente.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (err) {
    alert("Erro ao gerar PNG: " + err.message);
  } finally {
    // 3. Restaura os botões X no seu painel para você continuar usando
    elementosAcao.forEach(el => el.style.display = '');
  }
}

async function baixarNotaPDF() {
  const container = document.getElementById('containerNota');
  if (!container) {
    alert("Erro: Recipiente 'containerNota' não encontrado.");
    return;
  }

  try {
    const jspdfLib = window.jspdf || window.jsPDF;
    if (!jspdfLib) {
      alert("Erro: Biblioteca jsPDF não carregada.");
      return;
    }

    if (typeof atualizarPreviewNota === 'function') atualizarPreviewNota();
    await new Promise(r => setTimeout(r, 150));

    // Oculta coluna de remover item durante a captura
    const colunasAcao = container.querySelectorAll('.coluna-acao');
    colunasAcao.forEach(el => el.style.display = 'none');

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#111111',
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    colunasAcao.forEach(el => el.style.display = '');

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = jspdfLib;
    const pdf = jsPDF ? new jsPDF('p', 'mm', 'a4') : new jspdfLib('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const elCliente = document.getElementById('clienteNome') || document.getElementById('cliente');
    const nomeCliente = elCliente?.value?.trim() || 'Cliente';

    pdf.save(`Nota_DMArtFerro_${nomeCliente.replace(/\s+/g, '_')}.pdf`);

  } catch (err) {
    alert("Erro ao gerar PDF: " + err.message);
  }
}

async function exportarNota() {
  const elementoNota = document.getElementById('areaNota'); // ID da área da nota
  
  // 1. Esconde a coluna/botões de ação antes de capturar
  const elementosParaEsconder = elementoNota.querySelectorAll('.coluna-acoes, button, .btn-fechar');
  elementosParaEsconder.forEach(el => el.style.visibility = 'hidden');

  try {
    // 2. Captura a imagem/PDF sem os botões
    const canvas = await html2canvas(elementoNota, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // ... lógica do jsPDF ou download da imagem ...
    
  } catch (erro) {
    console.error("Erro ao exportar nota:", erro);
  } finally {
    // 3. Reexibe os botões na tela do sistema
    elementosParaEsconder.forEach(el => el.style.visibility = 'visible');
  }
}