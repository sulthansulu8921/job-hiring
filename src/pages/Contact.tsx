import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function Contact() {
    return (
        <div className="py-8 px-4 max-w-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
            <form className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <Input placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input placeholder="your@email.com" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <textarea
                        className="w-full min-h-[120px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="How can we help you?"
                    />
                </div>
                <Button className="w-full">Send Message</Button>
            </form>

            <div className="bg-primary-50 border border-primary-100 p-6 rounded-2xl text-center">
                <h2 className="text-lg font-bold text-primary-900 mb-2">Need immediate help?</h2>
                <p className="text-primary-700 text-sm mb-4">Start a live chat with our support team for any queries or issues.</p>
                <Button
                    variant="outline"
                    className="bg-white border-primary-200 text-primary-700 hover:bg-primary-50"
                    onClick={() => window.location.href = '/inbox'}
                >
                    Chat with Us
                </Button>
            </div>
        </div>
    );
}
