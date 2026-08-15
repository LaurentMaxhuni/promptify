import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm text-muted-foreground">Last updated: August 16, 2026</p>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="space-y-8 leading-7 text-muted-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">What Promptify processes</h2>
          <p>
            Promptify processes prompt text only when you choose to optimize it in the extension
            popup or click the inline Optimize button on a supported site. The extension does not
            continuously collect page content, browsing history, cookies, or passwords.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Transmission to external services</h2>
          <p>
            When you optimize a prompt, the prompt text and selected framework are sent over HTTPS
            to the Promptify Cloudflare Worker. The Worker forwards that request to Groq to generate
            the enhanced prompt, and the result is returned to the extension. Groq processes the
            request under its own privacy and retention policies; Promptify does not control Groq&apos;s
            handling of the request.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Local history and retention</h2>
          <p>
            The popup can save the full prompt, enhanced response, selected framework, and
            timestamp in Chrome&apos;s <code>chrome.storage.local</code> on your device. History is
            limited to 50 entries or approximately 250 KB, whichever is reached first. It remains
            there until you delete an entry, clear history, remove the extension, or Chrome clears
            the extension&apos;s storage. Inline enhancements on supported sites are not added to this
            popup history.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Server retention and logs</h2>
          <p>
            Prompt text is sent in a POST request body, not in a URL query string, and the
            Promptify Worker does not intentionally store or write prompt text to application logs.
            Cloudflare and Groq may retain technical request metadata or process content under
            their respective policies. The Worker uses authentication, request limits, and quotas
            to protect the service from unauthorized or excessive use.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Your choices</h2>
          <p>
            You can avoid sending a prompt by not selecting Optimize. You can delete individual
            history entries or clear all saved history from the popup. Do not submit information
            to Promptify that you are not comfortable sending to the Promptify Worker and Groq.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For privacy questions, please contact us through the{" "}
            <a
              className="text-foreground underline underline-offset-4"
              href="https://github.com/LaurentMaxhuni/promptify/issues"
              target="_blank"
              rel="noreferrer"
            >
              Promptify support page
            </a>
            . Return to the{" "}
            <Link className="text-foreground underline underline-offset-4" href="/">
              home page
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
