// app/contact/page.tsx
import { ContactPage } from "@/components/pages/ContactPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact | Mohammed Jumaan",
    description: "Get in touch with Mohammed Jumaan for collaborations, freelance opportunities, or just to say hi.",
};

export default function Page() {
    return <ContactPage />;
}
