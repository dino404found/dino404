import DinoApp from "./dino-app";
import { homeMetadata } from "@/lib/site-metadata";
export const metadata = homeMetadata(process.env);
export default function Home() {
  return <DinoApp />;
}
