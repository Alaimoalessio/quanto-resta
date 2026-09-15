import { renderToBuffer } from '@react-pdf/renderer';
import { decodeScenario } from '@/domain/share';
import { project } from '@/domain/engine';
import { sensitivity } from '@/domain/compare';
import { buildVerdict } from '@/domain/verdict';
import { validateAssumptions } from '@/domain/validate';
import { ReportDocument } from '@/lib/pdf/ReportDocument';

export const runtime = 'nodejs';

interface Body {
  s?: unknown; // scenario codificato come nell'URL
  image?: unknown; // data URL PNG della curva, generata dal client
}

const MAX_IMAGE = 4 * 1024 * 1024;

/** POST { s, image } → PDF A4 in due pagine. */
export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response('Corpo non valido', { status: 400 });
  }
  const scenario = typeof body.s === 'string' ? decodeScenario(body.s) : null;
  if (!scenario || validateAssumptions(scenario.assumptions).length > 0) {
    return new Response('Scenario non valido', { status: 400 });
  }
  const image =
    typeof body.image === 'string' &&
    body.image.startsWith('data:image/png;base64,') &&
    body.image.length < MAX_IMAGE
      ? body.image
      : null;

  const base = project(scenario.assumptions, []);
  const projection = project(scenario.assumptions, scenario.levers);
  const verdict = buildVerdict({
    assumptions: scenario.assumptions,
    levers: scenario.levers,
    base,
    scenario: projection,
    sensitivity: sensitivity(scenario.assumptions, scenario.levers, projection),
  });
  const generatedAt = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(new Date());

  const buffer = await renderToBuffer(
    <ReportDocument
      scenario={scenario}
      base={base}
      projection={projection}
      verdict={verdict}
      image={image}
      generatedAt={generatedAt}
    />,
  );
  const name = (scenario.name || 'scenario').replace(/[^\w\-]+/g, '-').toLowerCase();
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bussola-${name}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
