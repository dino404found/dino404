import Link from "next/link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { admin } from "@/lib/server";
import OwnerPanel from "./owner-panel";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  try {
    await admin();
  } catch {
    return (
      <main className="owner-shell">
        <Link className="wordmark" href="/">
          DINO404
        </Link>
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
