import type { ReactNode } from "react";
import {
  ESCOLA_PADRAO,
  LEGENDA_OCORRENCIAS,
  horasDecimais,
  type EscolaConfig,
} from "@/lib/livro-ponto-types";
import type { LivroPontoDocumento } from "@/lib/livro-ponto";
import { formatDateBR, formatDateTimeBR } from "@/lib/time";

const LINHAS_VERSO = 32;

function LogoBrasao({ escola }: { escola: EscolaConfig }) {
  const altura = Math.max(8, Math.min(45, escola.brasaoAlturaMm));
  const estilo = { height: `${altura * 2.6}px` } as const;

  if (escola.brasaoDataUrl) {
    return (
      <img
        src={escola.brasaoDataUrl}
        alt="Brasão da unidade escolar"
        style={estilo}
        className="w-auto max-w-[70px] object-contain"
      />
    );
  }

  return (
    <div
      className="grid w-[62px] place-items-center border border-black text-center leading-none"
      style={estilo}
    >
      <div>
        <p className="text-[9px] font-black tracking-tight">SIP</p>
        <p className="mt-0.5 text-[6px] uppercase">
          {escola.municipio.slice(0, 2).toUpperCase() || "SP"}
        </p>
        <p className="mt-0.5 text-[5px] uppercase">Governo do Estado</p>
      </div>
    </div>
  );
}

function Cabecalho({
  mesAno,
  pagina,
  comPagina = true,
  escola,
  comBrasao = true,
}: {
  mesAno: string;
  pagina?: string;
  comPagina?: boolean;
  escola: EscolaConfig;
  comBrasao?: boolean;
}) {
  return (
    <header className="border border-black">
      <div className="flex items-center">
        <div className="flex w-[74px] shrink-0 items-center justify-center self-stretch border-r border-black p-1.5">
          {comBrasao ? <LogoBrasao escola={escola} /> : null}
        </div>

        <div className="flex-1 px-2 py-1 text-left">
          <p className="text-[10px] font-bold">{escola.governo}</p>
          <p className="text-[9px] font-semibold">{escola.secretaria}</p>
          <p className="text-[8.5px]">
            <span className="font-semibold">UNIDADE:</span> {escola.unidade}
            {escola.cie ? ` — ${escola.cie}` : ""}
          </p>
          <p className="text-[7.5px]">
            {escola.diretoria}
          </p>
          <p className="text-[7.5px]">
            {escola.endereco} — {escola.municipio}/{escola.uf}
            {escola.telefone ? ` · Tel. ${escola.telefone}` : ""}
          </p>
          <p className="mt-0.5 text-[10px] font-bold">REGISTRO DE PONTO MÊS/ANO: {mesAno}</p>
        </div>

        <div className="flex w-[62px] shrink-0 items-start justify-end self-stretch px-1.5 py-1.5">
          {comPagina ? <p className="text-[10px] font-bold">PÁG. {pagina ?? "___"}</p> : null}
        </div>
      </div>
    </header>
  );
}

function LinhaPontilhada({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[10px] leading-[1.9] ${className}`}>
      <span className="font-semibold">{label}</span> {value}
    </p>
  );
}

function descricaoLancamento(dia: {
  feriadoNome: string | null;
  ocorrencia: string;
  observacao: string;
  incompleto: boolean;
}): string {
  const base = dia.ocorrencia?.trim() ? dia.ocorrencia.trim() : (dia.feriadoNome ?? "");
  return [
    base,
    dia.observacao,
    dia.incompleto ? "Batidas incompletas no dia" : null,
  ]
    .filter((item): item is string => Boolean(item && item.trim()))
    .filter((item, index, lista) => lista.indexOf(item) === index)
    .join(" — ");
}

const CODIGOS_SALDO = new Set(["S", "-"]);

function codigosLancamento(dia: { codigos: string[]; incompleto?: boolean }): string[] {
  return dia.codigos.filter((codigo) => !CODIGOS_SALDO.has(codigo.split(" ")[0]));
}

function temLancamento(dia: {
  codigos: string[];
  incompleto?: boolean;
  feriadoNome?: string | null;
}): boolean {
  return codigosLancamento(dia).length > 0 || Boolean(dia.incompleto) || Boolean(dia.feriadoNome);
}

export function LivroPontoFrente({
  documento,
  pagina,
  paginaAtual,
  totalPaginas,
  comQuebra = true,
  escola = ESCOLA_PADRAO,
}: {
  documento: LivroPontoDocumento;
  pagina?: string;
  paginaAtual?: number;
  totalPaginas?: number;
  comQuebra?: boolean;
  escola?: EscolaConfig;
}) {
  const { identificacao, oficial, dias } = documento;
  const hoje = new Date().toLocaleDateString("pt-BR");
  const porDia = new Map(dias.map((dia) => [Number(dia.dia), dia]));
  const todosOsDias = Array.from({ length: new Date(Number(documento.mes.slice(0, 4)), Number(documento.mes.slice(5, 7)), 0).getDate() }, (_, i) => i + 1);

  return (
    <article
      className={`print-page mx-auto w-full max-w-[1100px] bg-white p-4 text-black sm:p-6 ${
        comQuebra ? "print-break-after" : ""
      }`}
    >
      <Cabecalho
        mesAno={oficial.mesAno}
        pagina={paginaAtual != null && totalPaginas != null ? `${paginaAtual}/${totalPaginas}` : pagina}
        escola={escola}
      />

      <section className="mt-1.5 space-y-0.5">
        <div className="grid grid-cols-2 gap-x-6">
          <LinhaPontilhada
            label="SERVIDOR:"
            value={<span className="font-semibold">{identificacao.nome}</span>}
          />
          <LinhaPontilhada label="RG:" value={identificacao.rg} />
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <LinhaPontilhada label="CARGO/FUNÇÃO:" value={identificacao.cargo} />
          <LinhaPontilhada label="REGIME DE PLANTÃO:" value={oficial.regimePlantao} />
        </div>
        <LinhaPontilhada label="JORNADA DE TRABALHO:" value={oficial.jornadaHoras} />
        <LinhaPontilhada label="HORÁRIO DE TRABALHO:" value={oficial.horarioTrabalho} />
        <div className="grid grid-cols-2 gap-x-6">
          <LinhaPontilhada label="INTERVALO DE ALMOÇO E DESCANSO:" value={oficial.intervaloAlmoco} />
          <LinhaPontilhada label="HORÁRIO DE ESTUDANTE (SIM/NÃO):" value={oficial.horarioEstudante} />
        </div>
      </section>

      <table className="mt-2 w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border border-black px-1 py-0.5 text-center align-middle" rowSpan={2}>
              Dia
            </th>
            <th className="border border-black px-1 py-0.5 text-center" colSpan={2}>
              Entrada
            </th>
            <th className="border border-black px-1 py-0.5 text-center" colSpan={2}>
              Saída
            </th>
            <th className="border border-black px-1 py-0.5 text-center align-middle" rowSpan={2}>
              Observações
            </th>
            <th className="border border-black px-1 py-0.5 text-center align-middle" rowSpan={2}>
              Visto do superior
              <br />
              imediato
            </th>
          </tr>
          <tr>
            <th className="border border-black px-1 py-0.5 text-center font-semibold">Hora</th>
            <th className="border border-black px-1 py-0.5 text-center font-semibold">Assinatura</th>
            <th className="border border-black px-1 py-0.5 text-center font-semibold">Hora</th>
            <th className="border border-black px-1 py-0.5 text-center font-semibold">Assinatura</th>
          </tr>
        </thead>
        <tbody>
          {todosOsDias.map((numero) => {
            const dia = porDia.get(numero);
            const sabado = dia?.diaSemana === "Sáb";
            const domingo = dia?.diaSemana === "Dom";
            const textoHoraEspecial = dia
              ? dia.ausenciaIntegral
                ? "AUSÊNCIA TOTAL"
                : dia.feriadoNome && (dia.feriadoBloqueia || (!dia.entrada && !dia.saidaExpediente))
                  ? dia.feriadoNome.toUpperCase()
                  : null
              : null;
            const temObservacao = dia ? temLancamento(dia) : false;

            return (
              <tr key={numero} className={dia?.naoUtil ? "bg-neutral-100" : ""}>
                <td className="border border-black px-1 text-center font-semibold">{numero}</td>
                <td className="border border-black px-1 text-center font-mono">
                  {textoHoraEspecial ? (
                    <span className="text-[8px] font-bold uppercase tracking-tight text-red-600">
                      {textoHoraEspecial}
                    </span>
                  ) : (
                    dia?.entrada || ""
                  )}
                </td>
                <td
                  className={`border border-black px-1 text-center ${
                    sabado || domingo ? "text-[9px]" : "text-[7px] italic text-neutral-700"
                  }`}
                >
                  {textoHoraEspecial || (sabado ? "Sábado" : domingo ? "Domingo" : dia?.entrada ? "eletrônico" : "")}
                </td>
                <td className="border border-black px-1 text-center font-mono">
                  {textoHoraEspecial ? (
                    <span className="text-[8px] font-bold uppercase tracking-tight text-red-600">
                      {textoHoraEspecial}
                    </span>
                  ) : (
                    dia?.saidaExpediente || ""
                  )}
                </td>
                <td
                  className={`border border-black px-1 text-center ${
                    sabado || domingo ? "text-[9px]" : "text-[7px] italic text-neutral-700"
                  }`}
                >
                  {textoHoraEspecial || (sabado ? "Sábado" : domingo ? "Domingo" : dia?.saidaExpediente ? "eletrônico" : "")}
                </td>
                <td className="border border-black px-1 text-center align-middle text-[8px] font-bold">
                  {temObservacao ? (
                    <span className="uppercase tracking-tight text-red-600">VIDE VERSO</span>
                  ) : null}
                </td>
                <td className="border border-black px-1" />
              </tr>
            );
          })}
        </tbody>
      </table>

      <table className="mt-2 w-full border-collapse text-[8.5px]">
        <thead>
          <tr>
            <th className="border border-black bg-neutral-100 px-1 py-0.5 text-center" colSpan={6}>
              INFORMAÇÕES FINANCEIRAS
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="w-[90px] border border-black px-1 py-0.5 text-center font-bold">
              FÉRIAS
            </td>
            <td className="border border-black px-1 py-0.5">
              <p>
                DE {oficial.financeiro.feriasDe ? formatDateBR(oficial.financeiro.feriasDe) : "____/____/______"}
              </p>
              <p>
                ATÉ {oficial.financeiro.feriasAte ? formatDateBR(oficial.financeiro.feriasAte) : "____/____/______"}
              </p>
            </td>
            <td className="w-[110px] border border-black px-1 py-0.5 text-center font-bold">
              MÉDIA DE GTN
            </td>
            <td className="w-[110px] border border-black px-1 py-0.5 text-center font-bold">ACA</td>
            <td className="border border-black px-1 py-0.5">
              <p>
                DE {oficial.financeiro.acaDe ? formatDateBR(oficial.financeiro.acaDe) : "____/____/______"}
              </p>
              <p>
                ATÉ {oficial.financeiro.acaAte ? formatDateBR(oficial.financeiro.acaAte) : "____/____/______"}
              </p>
            </td>
            <td className="w-[110px] border border-black px-1 py-0.5 text-center">
              <p className="font-bold">QUANTIDADE</p>
              <p>{oficial.financeiro.acaQuantidade ?? ""}</p>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-center font-bold">GTN</td>
            <td className="border border-black px-1 py-0.5">
              <p>DE ____/____/______</p>
              <p>ATÉ ____/____/______</p>
            </td>
            <td className="border border-black px-1 py-0.5 text-center">20% &nbsp; 10%</td>
            <td className="border border-black px-1 py-0.5 text-center font-bold">
              SERVIÇO EXTRAORDINÁRIO
            </td>
            <td className="border border-black px-1 py-0.5">
              <p>
                DE{" "}
                {oficial.financeiro.servicoExtraDe
                  ? formatDateBR(oficial.financeiro.servicoExtraDe)
                  : "____/____/______"}
              </p>
              <p>
                ATÉ{" "}
                {oficial.financeiro.servicoExtraAte
                  ? formatDateBR(oficial.financeiro.servicoExtraAte)
                  : "____/____/______"}
              </p>
            </td>
            <td className="border border-black px-1 py-0.5 text-center">
              <p className="font-bold">QUANTIDADE</p>
              <p>{oficial.financeiro.servicoExtraQuantidade || ""}</p>
            </td>
          </tr>
          <tr>
            <td className="border border-black px-1 py-0.5 text-center font-bold">
              SUBSTITUIÇÃO EVENTUAL
            </td>
            <td className="border border-black px-1 py-0.5 text-center" colSpan={2}>
              PERÍODO ____/____/______ ATÉ ____/____/______
            </td>
            <td className="border border-black px-1 py-0.5 text-center font-bold">
              CARGO/FUNÇÃO
              <br />
              SUBSTITUÍDA
            </td>
            <td className="border border-black px-1 py-0.5 text-center" colSpan={2}>
              VALE TRANSPORTE - CLT(SIM/NÃO)
            </td>
          </tr>
        </tbody>
      </table>

      <footer className="mt-6">
        <div className="grid grid-cols-3 items-end gap-6">
          <div className="text-center">
            <div className="border-t border-black pt-1 text-[9px] font-semibold">
              ASSINATURA DO SERVIDOR
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-black pt-1 text-[9px] font-semibold">
              ASSINATURA DO SUPERIOR IMEDIATO
            </div>
          </div>
          <div className="text-right text-[9px] font-semibold">DATA: ___/___/____</div>
        </div>
      </footer>
    </article>
  );
}

export function LivroPontoVerso({
  documento,
  pagina,
  paginaAtual,
  totalPaginas,
  comQuebra = true,
  escola = ESCOLA_PADRAO,
}: {
  documento: LivroPontoDocumento;
  pagina?: string;
  paginaAtual?: number;
  totalPaginas?: number;
  comQuebra?: boolean;
  escola?: EscolaConfig;
}) {
  const { oficial, dias, totais, identificacao } = documento;
  const hoje = new Date().toLocaleDateString("pt-BR");
  const linhasEmBranco = 32;

  const resumoCodigos = new Map<string, number>();
  const lancamentos = dias
    .map((dia) => ({
      dia,
      codigos: codigosLancamento(dia),
    }))
    .filter(
      (item) => item.codigos.length > 0 || item.dia.incompleto || Boolean(item.dia.feriadoNome),
    );

  for (const item of lancamentos) {
    for (const codigo of item.codigos) {
      const base = codigo.split(" ")[0];
      resumoCodigos.set(base, (resumoCodigos.get(base) ?? 0) + 1);
    }
    if (item.dia.incompleto) {
      resumoCodigos.set("INC", (resumoCodigos.get("INC") ?? 0) + 1);
    }
  }

  return (
    <article
      className={`print-page mx-auto w-full max-w-[1100px] bg-white p-4 text-black sm:p-6 ${
        comQuebra ? "print-break-after" : ""
      }`}
    >
      <Cabecalho
        mesAno={oficial.mesAno}
        pagina={paginaAtual != null && totalPaginas != null ? `${paginaAtual}/${totalPaginas}` : pagina}
        comPagina={false}
        escola={escola}
        comBrasao={escola.brasaoNoVerso}
      />

      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-[13px] font-bold tracking-wide">CONSOLIDAÇÃO</h2>
        <p className="text-[8.5px]">
          Servidor: <span className="font-semibold">{identificacao.nome}</span> · RG{" "}
          {identificacao.rg} · Matrícula {identificacao.matricula}
        </p>
      </div>

      <section className="mt-1.5 border border-black">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black bg-neutral-100 px-2 py-1">
          <p className="text-[9.5px] font-bold uppercase tracking-wide">
            Lançamentos do mês — ausências, faltas, licenças, feriados e demais ocorrências
          </p>
          <p className="text-[8.5px] font-semibold">
            {lancamentos.length > 0
              ? `${lancamentos.length} dia(s) com lançamento`
              : "Nenhum lançamento no mês"}
          </p>
        </div>

        <table className="w-full border-collapse text-[8.5px]">
          <thead>
            <tr className="bg-neutral-50">
              <th className="w-[46px] border border-black px-1 py-0.5">Dia</th>
              <th className="w-[38px] border border-black px-1 py-0.5">Sem.</th>
              <th className="w-[96px] border border-black px-1 py-0.5">
                Código
                <br />
                (faltas/ocorrências)
              </th>
              <th className="border border-black px-1 py-0.5 text-left">
                Descrição do lançamento
              </th>
              <th className="w-[190px] border border-black px-1 py-0.5">
                Observações do superior imediato
              </th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map(({ dia, codigos }) => (
              <tr key={dia.data}>
                <td className="border border-black px-1 py-0.5 text-center font-semibold">
                  {dia.dia}
                </td>
                <td className="border border-black px-1 py-0.5 text-center">{dia.diaSemana}</td>
                <td className="border border-black px-1 py-0.5 text-center font-semibold">
                  {codigos.join(" · ")}
                  {dia.incompleto && codigos.length === 0 ? "INC" : null}
                </td>
                <td className="border border-black px-1 py-0.5">
                  {descricaoLancamento(dia)}
                </td>
                <td className="border border-black px-1 py-0.5" />
              </tr>
            ))}
            {lancamentos.length === 0 ? (
              <tr>
                <td
                  className="border border-black px-1 py-6 text-center text-[9px] uppercase"
                  colSpan={5}
                >
                  Sem lançamentos de ausências, faltas, licenças, feriados ou demais ocorrências
                  nesta competência.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black px-2 py-1 text-[8.5px]">
          <span className="font-bold uppercase">Resumo da consolidação:</span>
          {resumoCodigos.size > 0 ? (
            Array.from(resumoCodigos.entries()).map(([codigo, total]) => (
              <span key={codigo}>
                <span className="font-mono font-bold">{codigo}</span>: {total} dia(s)
              </span>
            ))
          ) : (
            <span>—</span>
          )}
          <span className="ml-auto font-semibold">
            Horas cumpridas no mês: {horasDecimais(totais.totalMinutos)} h · previstas:{" "}
            {horasDecimais(totais.esperadoMinutos)} h · faltas: {totais.diasFaltas} dia(s)
          </span>
        </div>
      </section>

      <p className="mt-2 text-[8.5px] font-semibold uppercase">
        Observações complementares e compensações de horas
      </p>
      <div className="mt-3 space-y-[16px]">
        {Array.from({ length: linhasEmBranco }).map((_, index) => (
          <div key={index} className="border-b border-black py-[12px]" />
        ))}
      </div>

      <footer className="mt-6">
        <div className="grid grid-cols-3 items-end gap-6">
          <div className="text-left text-[10px]">DATA: ___/___/____</div>
          <div className="text-center">
            <div className="border-t border-black pt-1 text-[10px] font-semibold">
              Assinatura do Superior Imediato
            </div>
          </div>
          <div className="text-right text-[11px] font-semibold italic">Verso</div>
        </div>
        <p className="mt-3 text-[6.5px] text-neutral-700">
          Consolidação das ocorrências do mês (códigos FI, FJ, FÉ, LS, LP, DO, AT, OT, FC, SP, FER,
          PF, REC, SUS, HE, A e INC). Os dias assinalados com "VIDE VERSO" na frente têm o
          lançamento detalhado nesta folha. Demonstrativo eletrônico de apoio: protocolo{" "}
          {documento.protocolo}.
        </p>
      </footer>
    </article>
  );
}

export function LivroPontoOficial({
  documento,
  paginaAtual,
  totalPaginas,
  escola = ESCOLA_PADRAO,
}: {
  documento: LivroPontoDocumento;
  paginaAtual?: number;
  totalPaginas?: number;
  escola?: EscolaConfig;
}) {
  return (
    <>
      <LivroPontoFrente
        documento={documento}
        pagina="1"
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        comQuebra
        escola={escola}
      />
      <LivroPontoVerso
        documento={documento}
        pagina="2"
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        comQuebra
        escola={escola}
      />
    </>
  );
}

export { ESCOLA_PADRAO };
