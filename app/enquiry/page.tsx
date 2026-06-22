import { EnquiryPage } from "@/components/pages/EnquiryPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Submit Enquiry | Mohammed Jumaan",
    description: "Submit your project requirements and enquiry securely to Mohammed Jumaan.",
};

export default function Page() {
    return <EnquiryPage />;
}
