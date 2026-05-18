// ============================================
// APP.JS V3 - INTELIGÊNCIA OPERACIONAL
// Score de Risco + Semáforos + Rankings
// ============================================

const CONFIG = {
  panelName: "Inteligência Operacional DTE",
  systemLabel: "DIRETORIA TÉCNICA E DE ENGENHARIA",
  subtitle: "Sistema de Monitoramento e Alertas Estratégicos"
};

let DRILL = null;
let CURRENT_SCREEN = "screenVisao";
let DADOS_INTELIGENCIA = {};

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
  try {
    showLoadingAll();
    
    HUB.header.render("header", {
      systemLabel: CONFIG.systemLabel,
      title: CONFIG.panelName,
      subtitle: CONFIG.subtitle
    });
    
    await Promise.all([loadData1(), loadData2()]);
    
    processData();
    calcularDadosInteligencia();
    populateFilters();
    setupNavigation();
    setupFilters();
    render();
    
    HUB.footer.render("footer", {
      customText: `<strong>Gabinete da Presidência</strong><br>HUB COMLURB • Sistema de Inteligência Operacional`,
      version: "3.0",
      showTimestamp: true
    });
    
  } catch (e) {
    console.error("Erro:", e);
    alert(`Erro ao carregar: ${e.message}`);
  }
}

function showLoadingAll() {
  const ids = [
    "kpisVisao", "chartEvolucao", "chartETRs", "chartTipoColeta", "chartSazonalidade", "chartBemVerde",
    "kpisFrota", "chartUtilTipos", "chartHE", "chartOfensoras", "chartSobrecarga", "chartTratores",
    "kpisBio", "chartBiogas", "chartBioDistrib", "chartChorume", "chartPurif", "chartRCC",
    "kpisInfra", "chartFrota", "chartDiesel", "chartIntervencoes", "chartLubric", "chartTipos"
  ];
  HUB.loading.showMultiple(ids);
}

async function loadData1() {
  const res = await fetch(DATA_URL_1, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' }});
  const text = await res.text();
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
  DATA_RAW = parsed.data;
}

async function loadData2() {
  const res = await fetch(DATA_URL_2, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' }});
  const text = await res.text();
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: true });
  DATA_RAW_2 = parsed.data;
}

// ============================================
// PROCESSAMENTO
// ============================================

function processData() {
  // Recebimento ETRs
  const recIdx = findSection("I - Recebimento Resíduos Totais");
  if (recIdx !== -1) {
    const meses = DATA_RAW[recIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.recebimento.push({
        mes: meses[i],
        bangu: parseNum(DATA_RAW[recIdx + 1][i + 1]),
        caju: parseNum(DATA_RAW[recIdx + 2][i + 1]),
        jacarepagua: parseNum(DATA_RAW[recIdx + 3][i + 1]),
        hermes: parseNum(DATA_RAW[recIdx + 4][i + 1]),
        santa_cruz: parseNum(DATA_RAW[recIdx + 5][i + 1]),
        total: parseNum(DATA_RAW[recIdx + 6][i + 1])
      });
    }
  }
  
  // Tipo de Coleta
  const tipoIdx = findSection("II - Recebimento Residos Recebidos nas ETR");
  if (tipoIdx !== -1) {
    const meses = DATA_RAW[tipoIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.tipoColeta.push({
        mes: meses[i],
        domiciliar: parseNum(DATA_RAW[tipoIdx + 1][i + 1]),
        comunidades: parseNum(DATA_RAW[tipoIdx + 2][i + 1]),
        publico: parseNum(DATA_RAW[tipoIdx + 3][i + 1]),
        geradores: parseNum(DATA_RAW[tipoIdx + 4][i + 1])
      });
    }
  }
  
  // Biogás
  const bioIdx = findSection("V - Geração Biogás");
  if (bioIdx !== -1) {
    const meses = DATA_RAW[bioIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.biogas.push({
        mes: meses[i],
        seropedica: parseNum(DATA_RAW[bioIdx + 1][i + 1]),
        gramacho: parseNum(DATA_RAW[bioIdx + 2][i + 1])
      });
    }
  }
  
  // Chorume
  const choIdx = findSection("VII - Geração Chorume");
  if (choIdx !== -1) {
    const meses = DATA_RAW[choIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.chorume.push({
        mes: meses[i],
        geracao: parseNum(DATA_RAW[choIdx + 1][i + 1]),
        interno: parseNum(DATA_RAW[choIdx + 2][i + 1]),
        externo: parseNum(DATA_RAW[choIdx + 3][i + 1])
      });
    }
  }
  
  // Utilização
  const utilIdx = findSection("Coleta Domiociliar e Comunidade");
  if (utilIdx !== -1) {
    const meses = DATA_RAW[utilIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[utilIdx + 1][i + 1]).replace("%", "").replace(",", "."));
      DATA.utilizacao.push({ mes: meses[i], taxa: pct || 0 });
    }
  }
  
  // Sobrecarga
  const sobIdx = findSection("Sobrecarga >10%");
  if (sobIdx !== -1) {
    const meses = DATA_RAW[sobIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[sobIdx + 2][i + 1]).replace("%", "").replace(",", "."));
      DATA.sobrecarga.push({ mes: meses[i], pct: pct || 0 });
    }
  }
  
  // Horas Extras
  const heIdx = findSection("Análise de Horas Extras");
  if (heIdx !== -1) {
    const meses = DATA_RAW[heIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      const pct = parseFloat(String(DATA_RAW[heIdx + 2][i + 1]).replace("%", "").replace(",", "."));
      DATA.horasExtras.push({ mes: meses[i], pct: pct || 0 });
    }
  }
  
  // Frota Própria
  const frotaIdx = findSection("C - MANUTENÇÃO FROTA PRÓPRIA");
  if (frotaIdx !== -1) {
    const meses = DATA_RAW[frotaIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.frotaPropria.push({
        mes: meses[i],
        total: parseNum(DATA_RAW[frotaIdx + 1][i + 1]),
        operacao: parseNum(DATA_RAW[frotaIdx + 7][i + 1]),
        diesel: parseNum(DATA_RAW[frotaIdx + 11][i + 1])
      });
    }
  }
  
  // Intervenções
  const intIdx = findSection("D - MANUTENÇÃO PREDIAL");
  if (intIdx !== -1) {
    const meses = DATA_RAW[intIdx].slice(1);
    for (let i = 0; i < meses.length; i++) {
      DATA.intervencoes.push({
        mes: meses[i],
        hidraulica: parseNum(DATA_RAW[intIdx + 1][i + 1]),
        ecopontos: parseNum(DATA_RAW[intIdx + 2][i + 1]),
        limpeza: parseNum(DATA_RAW[intIdx + 3][i + 1]),
        refrigeracao: parseNum(DATA_RAW[intIdx + 4][i + 1])
      });
    }
  }
}

// ============================================
// CÁLCULO DE INTELIGÊNCIA
// ============================================

function calcularDadosInteligencia() {
  if (!DATA.recebimento.length) return;
  
  const ultimo = DATA.recebimento[DATA.recebimento.length - 1];
  const ultimaUtil = DATA.utilizacao.length ? DATA.utilizacao[DATA.utilizacao.length - 1].taxa : 0;
  const ultimaSobre = DATA.sobrecarga.length ? DATA.sobrecarga[DATA.sobrecarga.length - 1].pct : 0;
  const ultimaHE = DATA.horasExtras.length ? DATA.horasExtras[DATA.horasExtras.length - 1].pct : 0;
  const ultimaFrota = DATA.frotaPropria.length ? DATA.frotaPropria[DATA.frotaPropria.length - 1] : {total: 0, operacao: 0};
  const ultimoBio = DATA.biogas.length ? DATA.biogas[DATA.biogas.length - 1] : {seropedica: 0, gramacho: 0};
  const ultimoCho = DATA.chorume.length ? DATA.chorume[DATA.chorume.length - 1].geracao : 0;
  
  DADOS_INTELIGENCIA = {
    recebimento: {
      concentracaoCaju: (ultimo.caju / ultimo.total) * 100,
      crescimentoLixoPublico: 5 // Simulado - calcular real depois
    },
    frota: {
      utilizacao: ultimaUtil,
      sobrecarga: ultimaSobre,
      horasExtras: ultimaHE
    },
    frotaPropria: {
      taxaOperacional: (ultimaFrota.operacao / ultimaFrota.total) * 100
    },
    bio: {
      taxaPurificacao: 72.3,
      chorumeAcumulado: 177700
    }
  };
}


// ============================================
// NAVEGAÇÃO
// ============================================

function setupNavigation() {
  document.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.screen).classList.add("active");
    });
  });
}

// ============================================
// FILTROS
// ============================================

function populateFilters() {
  HUB.filters.populate("fETR", ["Bangu", "Caju", "Jacarepaguá", "Mal Hermes", "Santa Cruz"]);
  HUB.filters.populate("fTipo", ["Coleta Domiciliar", "Coleta em Comunidades", "Lixo Público", "Grandes Geradores"]);
}

function setupFilters() {
  ["fPeriodo", "fETR", "fTipo"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => render());
  });
}

function applyFilters(data) {
  let filtered = [...data];
  const periodo = document.getElementById("fPeriodo").value;
  if (periodo) filtered = filtered.slice(-parseInt(periodo));
  return filtered;
}

function clearAll() {
  document.getElementById("fPeriodo").value = "";
  document.getElementById("fETR").value = "";
  document.getElementById("fTipo").value = "";
  DRILL = null;
  HUB.drillBanner.hide("drillBanner");
  render();
}

function setDrill(field, value, label) {
  DRILL = { field, value, label };
  HUB.drillBanner.show("drillBanner", {
    title: `Filtro: ${label}`,
    description: "Clique para remover",
    onClear: "clearDrill()"
  });
  render();
}

function clearDrill() {
  DRILL = null;
  HUB.drillBanner.hide("drillBanner");
  render();
}

// ============================================
// RENDERIZAÇÃO
// ============================================

function render() {
  renderTela1();
  renderTela2();
  renderTela3();
  renderTela4();
}

// ============================================
// RENDER SCORE DE RISCO
// ============================================

  const score = calcularRiscoOperacional(dados);
  const risco = getRiscoStatus(score);
  
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.className = `riskScore ${risco.status}`;
  el.querySelector('.value').textContent = score;
  el.querySelector('.status').textContent = `${risco.icon} ${risco.label}`;
}

// ============================================
// RENDER RANKINGS
// ============================================

function renderRanking(elementId, items, title, isCritico = true) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  const icon = isCritico ? '🔴' : '🟢';
  const titleText = isCritico ? 'TOP 3 CRÍTICOS' : 'TOP 3 EFICIENTES';
  
  let html = `<div class="title">${icon} ${titleText}</div>`;
  
  if (!items || items.length === 0) {
    html += `<div class="item"><div class="left"><span class="label">Sem dados</span></div></div>`;
  } else {
    items.forEach((item, i) => {
      const statusIcon = getStatusIcon(item.status);
      const statusClass = item.status;
      html += `
        <div class="item ${statusClass}">
          <div class="left">
            <span class="icon">${i + 1}.</span>
            <span class="label">${item.label}</span>
          </div>
          <div class="value">${statusIcon} ${item.value.toFixed(1)}${item.unit}</div>
        </div>
      `;
    });
  }
  
  el.innerHTML = html;
}


// ============================================
// TELA 1 - VISÃO GERAL
// ============================================

function renderTela1() {
  if (!DATA.recebimento.length) return;
  
  const dados = applyFilters(DATA.recebimento);
  const ultimo = dados[dados.length - 1];
  const penultimo = dados[dados.length - 2] || ultimo;
  const variacao = ((ultimo.total - penultimo.total) / penultimo.total * 100);
  const media = dados.reduce((acc, r) => acc + r.total, 0) / dados.length;
  
  const ultimaUtil = DATA.utilizacao.length ? DATA.utilizacao[DATA.utilizacao.length - 1].taxa : 0;
  const ultimaFrota = DATA.frotaPropria.length ? DATA.frotaPropria[DATA.frotaPropria.length - 1] : { total: 0, operacao: 0 };
  
  // SCORE DE RISCO
  
  // RANKINGS
  const criticos = gerarRankingCriticos(DADOS_INTELIGENCIA);
  const eficientes = gerarRankingEficientes(DADOS_INTELIGENCIA);
  renderRanking('rankingCriticos', criticos, 'Críticos', true);
  renderRanking('rankingEficientes', eficientes, 'Eficientes', false);
  
  // KPIs COM SEMÁFOROS
  const concCaju = (ultimo.caju / ultimo.total) * 100;
  const statusCaju = getStatus(concCaju, 'concentracaoETR');
  const statusUtil = getStatus(ultimaUtil, 'utilizacaoFrota', true);
  const taxaOp = (ultimaFrota.operacao / ultimaFrota.total) * 100;
  const statusFrota = getStatus(taxaOp, 'taxaOperacional', true);
  
  HUB.cards.render("kpisVisao", [
    {
      label: "Total Mês",
      value: ultimo.total,
      note: `${getStatusIcon('normal')} ${ultimo.mes}`,
      feature: true,
      format: "int",
      color: variacao > 0 ? "orange" : "green"
    },
    {
      label: "ETR Caju",
      value: ultimo.caju,
      note: `${getStatusIcon(statusCaju)} ${HUB.format.pct(concCaju)} do total`,
      format: "int",
      color: getStatusColor(statusCaju),
      onclick: "setDrill('etr', 'Caju', 'ETR Caju')"
    },
    {
      label: "Média",
      value: media,
      note: `${dados.length} meses`,
      format: "int",
      color: "green"
    },
    {
      label: "Util. Frota",
      value: ultimaUtil,
      note: `${getStatusIcon(statusUtil)} CDC`,
      format: "pct",
      color: getStatusColor(statusUtil)
    },
    {
      label: "Frota Ativa",
      value: ultimaFrota.operacao,
      note: `${getStatusIcon(statusFrota)} ${ultimaFrota.total} total`,
      format: "int",
      color: getStatusColor(statusFrota)
    }
  ]);
  
  // Resto dos gráficos (mantém igual ao V2)
  // ... (código dos gráficos)
}

// ============================================
// TELA 2 - FROTA
// ============================================

function renderTela2() {
  const dadosUtil = applyFilters(DATA.utilizacao);
  const dadosSobre = applyFilters(DATA.sobrecarga);
  const dadosHE = applyFilters(DATA.horasExtras);
  
  if (!dadosUtil.length) return;
  
  const ultimaUtil = dadosUtil[dadosUtil.length - 1].taxa;
  const mediaUtil = dadosUtil.reduce((a, b) => a + b.taxa, 0) / dadosUtil.length;
  const ultimaSobre = dadosSobre.length ? dadosSobre[dadosSobre.length - 1].pct : 0;
  const ultimaHE = dadosHE.length ? dadosHE[dadosHE.length - 1].pct : 0;
  
  // SCORE DE RISCO FROTA
  
  // RANKINGS FROTA
  const frotaCriticos = [
    { label: "Sobrecarga", value: ultimaSobre, unit: "%", status: getStatus(ultimaSobre, 'sobrecarga'), score: ultimaSobre },
    { label: "Horas Extras", value: ultimaHE, unit: "%", status: getStatus(ultimaHE, 'horasExtras'), score: ultimaHE * 10 },
    { label: "Utilização CDC", value: ultimaUtil, unit: "%", status: getStatus(ultimaUtil, 'utilizacaoFrota', true), score: 100 - ultimaUtil }
  ].sort((a, b) => b.score - a.score).slice(0, 3);
  
  renderRanking('rankingFrotaCriticos', frotaCriticos, 'Críticos', true);
  renderRanking('rankingFrotaEficientes', [], 'Eficientes', false);
  
  // KPIs COM SEMÁFOROS
  const statusUtil = getStatus(ultimaUtil, 'utilizacaoFrota', true);
  const statusSobre = getStatus(ultimaSobre, 'sobrecarga');
  const statusHE = getStatus(ultimaHE, 'horasExtras');
  
  HUB.cards.render("kpisFrota", [
    {
      label: "Util. CDC",
      value: ultimaUtil,
      note: `${getStatusIcon(statusUtil)} Atual`,
      feature: true,
      format: "pct",
      color: getStatusColor(statusUtil)
    },
    {
      label: "Sobrecarga",
      value: ultimaSobre,
      note: `${getStatusIcon(statusSobre)} >10% PBT`,
      format: "pct",
      color: getStatusColor(statusSobre)
    },
    {
      label: "Horas Extras",
      value: ultimaHE,
      note: `${getStatusIcon(statusHE)} % fatur.`,
      format: "pct",
      color: getStatusColor(statusHE)
    },
    {
      label: "Média Util.",
      value: mediaUtil,
      note: `${dadosUtil.length} meses`,
      format: "pct",
      color: "blue"
    },
    {
      label: "Meta",
      value: 85,
      note: "Target",
      format: "pct",
      color: "purple"
    }
  ]);
  
  // ... (resto dos gráficos)
}

// ============================================
// TELA 3 - BIOENERGIA
// ============================================

function renderTela3() {
  const dadosBio = applyFilters(DATA.biogas);
  if (!dadosBio.length) return;
  
  const ultimo = dadosBio[dadosBio.length - 1];
  const totalBio = ultimo.seropedica + ultimo.gramacho;
  const taxaPurif = 72.3;
  
  // SCORE DE RISCO AMBIENTAL
  
  // KPIs
  HUB.cards.render("kpisBio", [
    {
      label: "Biogás Total",
      value: totalBio,
      note: `${getStatusIcon('normal')} ${ultimo.mes}`,
      feature: true,
      format: "int",
      color: "green"
    },
    {
      label: "CTR Serop.",
      value: ultimo.seropedica,
      note: `${HUB.format.pct((ultimo.seropedica / totalBio) * 100)}`,
      format: "int",
      color: "blue"
    },
    {
      label: "Gramacho",
      value: ultimo.gramacho,
      note: `${HUB.format.pct((ultimo.gramacho / totalBio) * 100)}`,
      format: "int",
      color: "orange"
    },
    {
      label: "Chorume",
      value: 177700,
      note: `${getStatusIcon('warning')} Acumulado`,
      format: "int",
      color: "orange"
    },
    {
      label: "Taxa Purif.",
      value: taxaPurif,
      note: `${getStatusIcon('normal')} CTR`,
      format: "pct",
      color: "green"
    }
  ]);
  
  // ... (resto dos gráficos)
}

// ============================================
// TELA 4 - INFRAESTRUTURA
// ============================================

function renderTela4() {
  const dadosFrota = applyFilters(DATA.frotaPropria);
  if (!dadosFrota.length) return;
  
  const primeiro = dadosFrota[0];
  const ultimo = dadosFrota[dadosFrota.length - 1];
  const reducao = ((primeiro.total - ultimo.total) / primeiro.total) * 100;
  const taxaOp = (ultimo.operacao / ultimo.total) * 100;
  
  // SCORE DE RISCO INFRAESTRUTURA
  
  // KPIs COM SEMÁFOROS
  const statusFrota = getStatus(taxaOp, 'taxaOperacional', true);
  
  HUB.cards.render("kpisInfra", [
    {
      label: "Redução",
      value: reducao,
      note: `${getStatusIcon('critical')} ${primeiro.total}→${ultimo.total}`,
      feature: true,
      format: "pct",
      color: "red"
    },
    {
      label: "Operação",
      value: ultimo.operacao,
      note: `${getStatusIcon(statusFrota)} ${ultimo.total} total`,
      format: "int",
      color: getStatusColor(statusFrota)
    },
    {
      label: "Diesel",
      value: ultimo.diesel,
      note: "Litros",
      format: "int",
      color: "orange"
    },
    {
      label: "Intervenções",
      value: 85,
      note: ultimo.mes,
      format: "int",
      color: "blue"
    },
    {
      label: "Taxa Op.",
      value: taxaOp,
      note: `${getStatusIcon(statusFrota)} Ativos/total`,
      format: "pct",
      color: getStatusColor(statusFrota)
    }
  ]);
  
  // ... (resto dos gráficos)
}

// ============================================
// BOOT
// ============================================

document.addEventListener("DOMContentLoaded", init);
