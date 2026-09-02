import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [{ title: "Política de Privacidade — Portal Condomínio Miguel Arcanjo" }],
  }),
  component: PrivacidadePage,
});

const SECOES: { titulo: string; corpo: React.ReactNode }[] = [
  {
    titulo: "Quem trata os seus dados",
    corpo: (
      <p>
        O Condomínio Residencial Miguel Arcanjo, através da síndica, é quem decide como e por
        que os dados pessoais tratados neste portal são coletados e usados. Dúvidas ou pedidos
        relacionados aos seus dados podem ser enviados pro e-mail{" "}
        <strong>sindica.miguelarcanjo@gmail.com</strong>.
      </p>
    ),
  },
  {
    titulo: "Quais dados coletamos",
    corpo: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li><strong>Moradores</strong>: nome completo, e-mail, unidade (bloco e apartamento) e senha (armazenada de forma criptografada, nunca em texto puro).</li>
        <li><strong>Visitantes</strong>: nome, CPF, placa de veículo (quando informada) e período de visita, cadastrados pelo morador responsável.</li>
        <li><strong>Formulário público de contato</strong>: nome, e-mail, telefone e a mensagem enviada por quem preenche o formulário na página inicial.</li>
        <li><strong>Uso do portal</strong>: histórico de pagamentos, reservas de espaços, votações, chamados de manutenção e anúncios no mural/classificados, associados à sua unidade.</li>
      </ul>
    ),
  },
  {
    titulo: "Por que coletamos e como usamos",
    corpo: (
      <p>
        Usamos esses dados para viabilizar a gestão do condomínio: identificar moradores e
        liberar acesso ao portal, controlar a entrada de visitantes, processar cobranças e
        histórico financeiro, organizar reservas de espaços comuns, conduzir votações internas,
        registrar e responder chamados de manutenção, e responder mensagens enviadas pelo
        formulário público. A base legal é a execução do contrato de condomínio, o cumprimento
        de obrigações legais (ex.: controle de acesso e segurança) e o interesse legítimo da
        administração condominial.
      </p>
    ),
  },
  {
    titulo: "Com quem compartilhamos",
    corpo: (
      <p>
        Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais. Os dados
        ficam armazenados na infraestrutura do nosso provedor de banco de dados (Supabase), que
        atua apenas como operador técnico. Podemos compartilhar informações quando exigido por
        lei, ordem judicial ou para proteger a segurança do condomínio e de seus moradores.
      </p>
    ),
  },
  {
    titulo: "Como protegemos seus dados",
    corpo: (
      <p>
        Senhas nunca são armazenadas em texto puro. O acesso aos dados é restrito por perfil
        (morador só vê os próprios dados e informações públicas do condomínio; a síndica tem
        acesso administrativo). Tentativas de login são limitadas contra ataques automatizados.
        Nenhum sistema é 100% livre de risco, mas adotamos as práticas de segurança padrão da
        plataforma que usamos.
      </p>
    ),
  },
  {
    titulo: "Por quanto tempo guardamos",
    corpo: (
      <p>
        Mantemos os dados enquanto a unidade estiver vinculada ao condomínio ou pelo prazo
        exigido por obrigações legais e contábeis (ex.: histórico financeiro). Dados de
        visitantes ficam associados ao período de visita registrado. Você pode pedir a exclusão
        do que não for legalmente obrigatório manter, conforme a seção abaixo.
      </p>
    ),
  },
  {
    titulo: "Seus direitos (LGPD)",
    corpo: (
      <p>
        Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a
        qualquer momento: confirmação de que tratamos seus dados, acesso aos dados, correção de
        informações incompletas ou desatualizadas, anonimização/eliminação de dados
        desnecessários, portabilidade a outro fornecedor, e informação sobre com quem
        compartilhamos seus dados. Pra exercer qualquer desses direitos, entre em contato com a
        síndica pelo e-mail acima.
      </p>
    ),
  },
];

function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
          <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--gold)]">
            <ShieldCheck className="h-3.5 w-3.5" /> Conformidade LGPD
          </span>
          <h1 className="mt-3 font-display text-3xl font-medium md:text-4xl">Política de Privacidade</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Como o Portal Condomínio Residencial Miguel Arcanjo coleta, usa e protege os dados
            pessoais de moradores, visitantes e visitantes do site público.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-10">
          {SECOES.map((s) => (
            <section key={s.titulo}>
              <h2 className="font-display text-xl font-semibold">{s.titulo}</h2>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
                {s.corpo}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Escreva pra{" "}
            <strong className="text-foreground">sindica.miguelarcanjo@gmail.com</strong>.
          </p>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">Última atualização: agosto de 2026.</p>
      </main>
    </div>
  );
}
