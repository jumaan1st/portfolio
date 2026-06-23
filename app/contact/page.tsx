import { ContactPage } from "@/components/pages/ContactPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact | Mohammed Jumaan",
    description: "Contact Mohammed Jumaan for freelance opportunities, project discussions, or suggestions.",
};

export default function Page() {
    return <ContactPage />;
}
