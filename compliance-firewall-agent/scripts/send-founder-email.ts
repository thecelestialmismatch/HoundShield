/**
 * send-founder-email — send ONE founder email, from the founder's real address,
 * after proving it is safe to send.
 *
 * Run with tsx (already a devDependency):
 *
 *   # See exactly what would be sent. Sends nothing.
 *   npm run email:preview -- --template smoke-test --to you@yourdomain.com
 *
 *   # Actually send. Requires --confirm AND RESEND_API_KEY.
 *   npm run email:send -- --template smoke-test --to you@yourdomain.com --confirm
 *
 *   npm run email:send -- --template healthcare --to real@clinic.org \
 *     --first-name Dana --organization "Ridgeview Family Medicine" --confirm
 *
 * DESIGN CONSTRAINTS, each one deliberate:
 *
 *  - DRY RUN IS THE DEFAULT. Sending an email is irreversible; you cannot unsend
 *    a bad first impression to a buyer. Nothing leaves the machine without
 *    --confirm.
 *  - ONE RECIPIENT PER RUN. There is no --to-file, no CSV, no loop. This is a
 *    tool for a founder writing to a person, not a bulk sender. Volume without
 *    per-recipient thought is how a domain's reputation dies, and a burnt domain
 *    also takes down password resets and receipts.
 *  - PLACEHOLDERS ARE REFUSED. A recipient on a reserved example domain, or a
 *    name still reading "[First name]", exits non-zero instead of sending.
 *  - NO SILENT SUCCESS. Resend's response is inspected; an error is reported
 *    with its message and a non-zero exit.
 */

import { founderInbox, isSendableAddress, isEmailShaped, FOUNDER_ADDRESS } from '../lib/email/identity';
import { OUTREACH_DRAFTS, getDraft, render } from '../lib/email/outreach';

interface Args {
  template?: string;
  to?: string;
  firstName?: string;
  organization?: string;
  aiTool?: string;
  confirm: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { confirm: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--template': args.template = next(); break;
      case '--to': args.to = next(); break;
      case '--first-name': args.firstName = next(); break;
      case '--organization': args.organization = next(); break;
      case '--ai-tool': args.aiTool = next(); break;
      case '--confirm': args.confirm = true; break;
      case '--help': case '-h': args.help = true; break;
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown flag: ${a}`);
          process.exit(2);
        }
    }
  }
  return args;
}

function usage(): void {
  console.log(`
send-founder-email — send one founder email from ${FOUNDER_ADDRESS}

  --template <id>       Which draft. One of:
${OUTREACH_DRAFTS.map((d) => `                          ${d.id.padEnd(12)} ${d.audience}`).join('\n')}
  --to <email>          The single recipient. Must be a real address.
  --first-name <name>   Recipient's first name (required by most drafts).
  --organization <org>  Recipient's organisation (required by most drafts).
  --confirm             Actually send. Without this, it is a dry run.
  --help                This message.

Dry run is the default. Nothing is sent unless you pass --confirm.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.template) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const draft = getDraft(args.template);
  if (!draft) {
    console.error(`Unknown template "${args.template}". Known: ${OUTREACH_DRAFTS.map((d) => d.id).join(', ')}`);
    process.exit(2);
  }

  // Default the smoke test at the founder's own inbox — that is its whole purpose.
  const to = args.to?.trim() || (draft.id === 'smoke-test' ? founderInbox() : undefined);
  if (!to) {
    console.error('Missing --to. A recipient is required.');
    process.exit(2);
  }

  if (!isEmailShaped(to)) {
    console.error(`Refusing to send: "${to}" is not a valid email address.`);
    process.exit(1);
  }

  if (!isSendableAddress(to)) {
    console.error(
      `Refusing to send: "${to}" looks like a placeholder (a reserved example domain, or unfilled template text).\n` +
      `Only send to an address you have actually verified belongs to a real person.`,
    );
    process.exit(1);
  }

  let rendered;
  try {
    rendered = render(draft, {
      firstName: args.firstName,
      organization: args.organization,
      aiTool: args.aiTool,
    });
  } catch (err) {
    console.error(`Refusing to send: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const divider = '─'.repeat(72);
  console.log(`\n${divider}`);
  console.log(`Template : ${draft.id}  (${draft.audience})`);
  console.log(`From     : ${rendered.from}`);
  console.log(`Reply-To : ${rendered.replyTo}`);
  console.log(`To       : ${to}`);
  console.log(`Subject  : ${rendered.subject}`);
  console.log(divider);
  console.log(rendered.text);
  console.log(`${divider}\n`);

  if (!args.confirm) {
    console.log('DRY RUN — nothing was sent. Re-run with --confirm to send this.\n');
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set, so nothing can be sent. Export it and retry.');
    process.exit(1);
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: rendered.from,
    to,
    replyTo: rendered.replyTo,
    subject: rendered.subject,
    text: rendered.text,
  });

  if (result.error) {
    console.error(`SEND FAILED: ${result.error.message}`);
    process.exit(1);
  }

  console.log(`SENT to ${to} (id ${result.data?.id ?? 'unknown'}).`);
  console.log(`Now check that inbox, and reply to it to prove ${FOUNDER_ADDRESS} receives.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
