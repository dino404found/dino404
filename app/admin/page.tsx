/* eslint-disable @next/next/no-html-link-for-pages -- The owner boundary uses full document navigation, including when access is denied. */
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { admin } from "@/lib/server";
import OwnerPanel from "./owner-panel";
export const dynamic = "force-dynamic";
export const metadata = { title: "DINO404 — Owner area", robots: { index: false, follow: false } };
export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  try {
    await admin();
  } catch {
    return (
      <main className="owner-shell">
        <a className="wordmark" href="/">
          DINO404
        </a>
        <h1>Owner access is not configured.</h1>
        <p>
          This page is private. Ask the site owner to configure the permitted
          admin email before exporting results.
        </p>
        <p>
          <a href="/signout-with-chatgpt?return_to=/admin">
            Sign out and use another account
          </a>
        </p>
      </main>
    );
  }
  return <OwnerPanel />;
}
