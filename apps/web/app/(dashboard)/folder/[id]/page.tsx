import { redirect } from "next/navigation";

export default function FolderPage() {
  // Old route - redirect to workspace root which will find the right workspace
  redirect("/home");
}
