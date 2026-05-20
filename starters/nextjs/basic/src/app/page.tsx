import Link from "next/link";

export default function Home() {
  const message = process.env["MESSAGE"] || "Hello!";
  return (
    <main className="content">
      <h1 className="heading">ViewLab immersive Dronevideos</h1>
      

      <section className="features">
        <article className="card">
          <h2>Scalable, serverless backends</h2>
          <p>
            Dynamic content is served by{" "}
            <Link
              href="https://cloud.google.com/run/docs/overview/what-is-cloud-run"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloud Run
            </Link>
            , a fully managed container that scales up and down with demand.
            Visit{" "}
            <Link href="/ssr">
              <code>/ssr</code>
            </Link>{" "}
            and{" "}
            <Link href="/ssr/streaming">
              <code>/ssr/streaming</code>
            </Link>{" "}
            to see the server in action.
          </p>
        </article>
        <article className="card">
          <h2>Global CDN</h2>
          <p>
            Cached content is served by{" "}
            <Link
              href="https://cloud.google.com/cdn/docs/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Cloud CDN
            </Link>
            , a fast and secure way to host cached content globally. Visit
            <Link href="/ssg">
              {" "}
              <code>/ssg</code>
            </Link>{" "}
          </p>
        </article>
      </section>
    </main>
  );
}
